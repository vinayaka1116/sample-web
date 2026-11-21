import asyncio
import hashlib
import json
from http.cookies import SimpleCookie
from pathlib import Path
import tempfile
import unittest
from types import SimpleNamespace
from urllib.parse import urlsplit
from unittest.mock import patch

import pandas as pd
from fastapi import HTTPException, Request, Response
from pydantic import ValidationError

from app import auth, market_search, portfolio
from app.main import app
from app.routes import prediction, stocks


class IsolatedDatabaseTestCase(unittest.TestCase):
    def setUp(self):
        self.temp_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_directory.cleanup)
        root = Path(self.temp_directory.name)

        for module, filename in (
            (auth, "users.db"),
            (portfolio, "portfolio.db"),
        ):
            database_path = patch.object(module, "DB_PATH", root / filename)
            database_path.start()
            self.addCleanup(database_path.stop)

        auth.init_db()
        portfolio.init_db()

    def asgi_request(self, method, path, payload=None, headers=None):
        parsed_path = urlsplit(path)
        body = json.dumps(payload).encode("utf-8") if payload is not None else b""
        request_headers = {
            "content-type": "application/json",
            "origin": "http://127.0.0.1:5173",
        }
        request_headers.update(headers or {})
        scope = {
            "type": "http",
            "asgi": {"version": "3.0", "spec_version": "2.3"},
            "http_version": "1.1",
            "method": method,
            "scheme": "http",
            "path": parsed_path.path,
            "raw_path": parsed_path.path.encode("ascii"),
            "query_string": parsed_path.query.encode("ascii"),
            "root_path": "",
            "headers": [
                (key.lower().encode("latin-1"), value.encode("latin-1"))
                for key, value in request_headers.items()
            ],
            "client": ("testclient", 50000),
            "server": ("testserver", 80),
            "extensions": {},
        }
        messages = []
        sent_request = False

        async def receive():
            nonlocal sent_request
            if not sent_request:
                sent_request = True
                return {"type": "http.request", "body": body, "more_body": False}
            return {"type": "http.disconnect"}

        async def send(message):
            messages.append(message)

        asyncio.run(app(scope, receive, send))
        start = next(message for message in messages if message["type"] == "http.response.start")
        response_body = b"".join(
            message.get("body", b"")
            for message in messages
            if message["type"] == "http.response.body"
        )
        response_headers = {
            key.decode("latin-1").lower(): value.decode("latin-1")
            for key, value in start["headers"]
        }
        return start["status"], response_headers, json.loads(response_body or b"{}")

    def session_cookie(self, headers):
        cookie = SimpleCookie()
        cookie.load(headers["set-cookie"])
        return cookie[auth.SESSION_COOKIE_NAME].value

    def register_user(self, email: str, name: str = "Test User"):
        response = Response()
        result = auth.register(
            auth.RegisterRequest(
                name=name,
                email=email,
                password="long-test-password-123",
                age_confirmed=True,
                terms_accepted=True,
            ),
            response,
        )
        return {**result, "access_token": self.session_cookie(response.headers)}

    def session_user(self, result):
        request = Request({
            "type": "http",
            "headers": [
                (b"cookie", f"{auth.SESSION_COOKIE_NAME}={result['access_token']}".encode())
            ],
        })
        return auth.get_current_user(request)


class AuthenticationTests(IsolatedDatabaseTestCase):
    def test_http_api_uses_http_only_cookie_session(self):
        status, headers, body = self.asgi_request(
            "POST",
            "/api/auth/register",
            {
                "name": "Cookie User",
                "email": "cookie@example.com",
                "password": "long-test-password-123",
                "age_confirmed": True,
                "terms_accepted": True,
            },
        )
        self.assertEqual(status, 200)
        self.assertIn("httponly", headers["set-cookie"].lower())
        self.assertIn("samesite=lax", headers["set-cookie"].lower())
        self.assertNotIn("access_token", body)
        token = self.session_cookie(headers)

        status, _, body = self.asgi_request(
            "GET",
            "/api/auth/me",
            headers={"cookie": f"{auth.SESSION_COOKIE_NAME}={token}"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["user"]["email"], "cookie@example.com")

        status, _, body = self.asgi_request(
            "GET",
            "/api/auth/me",
            headers={"Authorization": "Bearer obsolete-token"},
        )
        self.assertEqual(status, 401)
        self.assertEqual(body["detail"], "Authentication required.")

        status, headers, _ = self.asgi_request(
            "POST",
            "/api/auth/logout",
            headers={"cookie": f"{auth.SESSION_COOKIE_NAME}={token}"},
        )
        self.assertEqual(status, 200)
        self.assertIn("max-age=0", headers["set-cookie"].lower())

    def test_state_changing_api_rejects_untrusted_origin(self):
        status, _, body = self.asgi_request(
            "POST",
            "/api/auth/register",
            {
                "name": "Blocked User",
                "email": "blocked@example.com",
                "password": "long-test-password-123",
                "age_confirmed": True,
                "terms_accepted": True,
            },
            headers={"origin": "https://attacker.example"},
        )
        self.assertEqual(status, 403)
        self.assertEqual(body["detail"], "Request origin is not allowed.")

    def test_registration_issues_session_stored_as_hash(self):
        result = self.register_user("one@example.com")

        self.assertEqual(result["user"]["email"], "one@example.com")
        self.assertGreater(result["expires_in"], 0)
        self.assertEqual(self.session_user(result)["id"], result["user"]["id"])

        stored = hashlib.sha256(result["access_token"].encode("utf-8")).hexdigest()
        connection = auth.get_db()
        try:
            row = connection.execute(
                "SELECT token_hash FROM sessions WHERE user_id = ?",
                (result["user"]["id"],),
            ).fetchone()
        finally:
            connection.close()
        self.assertEqual(row["token_hash"], stored)
        self.assertNotEqual(row["token_hash"], result["access_token"])

    def test_registration_requires_long_password_and_consent(self):
        with self.assertRaises(ValidationError):
            auth.RegisterRequest(
                name="Test User",
                email="short-password@example.com",
                password="short",
            )

        with self.assertRaises(HTTPException) as error:
            auth.register(
                auth.RegisterRequest(
                    name="Test User",
                    email="no-consent@example.com",
                    password="long-test-password-123",
                ),
                Response(),
            )
        self.assertEqual(error.exception.status_code, 400)

    def test_login_logout_and_revoked_session(self):
        self.register_user("login@example.com")
        response = Response()
        result = auth.login(
            auth.LoginRequest(
                email="login@example.com",
                password="long-test-password-123",
            ),
            response,
        )
        result["access_token"] = self.session_cookie(response.headers)

        self.assertEqual(self.session_user(result)["email"], "login@example.com")
        request = Request({
            "type": "http",
            "headers": [
                (b"cookie", f"{auth.SESSION_COOKIE_NAME}={result['access_token']}".encode())
            ],
        })
        auth.logout(request, Response())
        with self.assertRaises(HTTPException) as error:
            self.session_user(result)
        self.assertEqual(error.exception.status_code, 401)

    def test_invalid_login_and_demo_registration_are_rejected(self):
        with self.assertRaises(HTTPException) as error:
            auth.login(
                auth.LoginRequest(
                    email="missing@example.com",
                    password="wrong-password",
                ),
                Response(),
            )
        self.assertEqual(error.exception.status_code, 401)

        with self.assertRaises(HTTPException) as error:
            auth.register(
                auth.RegisterRequest(
                    name="Demo User",
                    email="admin@stockai.com",
                    password="long-test-password-123",
                    age_confirmed=True,
                    terms_accepted=True,
                ),
                Response(),
            )
        self.assertEqual(error.exception.status_code, 400)


class PortfolioAccessTests(IsolatedDatabaseTestCase):
    def test_portfolio_is_scoped_to_authenticated_user(self):
        owner = self.session_user(self.register_user("owner@example.com", "Owner User"))
        other = self.session_user(self.register_user("other@example.com", "Other User"))

        portfolio.add_portfolio_item(
            portfolio.PortfolioItemCreate(
                name="Example Corp",
                symbol="TEST",
                quantity=4,
                buy_price=12.5,
            ),
            owner,
        )

        owned = portfolio.get_portfolio(Response(), owner)
        not_owned = portfolio.get_portfolio(Response(), other)
        self.assertEqual(owned["email"], "owner@example.com")
        self.assertEqual(len(owned["portfolio"]), 1)
        self.assertEqual(not_owned["portfolio"], [])

        with self.assertRaises(HTTPException) as error:
            portfolio.delete_portfolio_stock("TEST", other)
        self.assertEqual(error.exception.status_code, 404)
        self.assertEqual(len(portfolio.get_portfolio(Response(), owner)["portfolio"]), 1)

    def test_share_links_are_read_only_and_revocable(self):
        owner = self.session_user(self.register_user("share@example.com"))
        portfolio.add_portfolio_item(
            portfolio.PortfolioItemCreate(
                name="Example Corp",
                symbol="TEST",
                quantity=2,
                buy_price=20,
            ),
            owner,
        )

        first_token = portfolio.create_portfolio_share(owner)["share_token"]
        shared = portfolio.get_shared_portfolio(
            portfolio.PortfolioShareLookup(token=first_token),
            Response(),
        )
        self.assertEqual(len(shared["portfolio"]), 1)

        second_token = portfolio.create_portfolio_share(owner)["share_token"]
        for revoked_token in (first_token,):
            with self.assertRaises(HTTPException) as error:
                portfolio.get_shared_portfolio(
                    portfolio.PortfolioShareLookup(token=revoked_token),
                    Response(),
                )
            self.assertEqual(error.exception.status_code, 404)

        portfolio.revoke_portfolio_share(owner)
        with self.assertRaises(HTTPException) as error:
            portfolio.get_shared_portfolio(
                portfolio.PortfolioShareLookup(token=second_token),
                Response(),
            )
        self.assertEqual(error.exception.status_code, 404)


class RemovedFeatureTests(IsolatedDatabaseTestCase):
    def test_google_sign_in_api_is_not_available(self):
        status, _, _ = self.asgi_request(
            "POST",
            "/api/auth/google",
            {"credential": "unused"},
        )
        self.assertEqual(status, 404)

    def test_paper_trading_api_is_not_available(self):
        status, _, _ = self.asgi_request("GET", "/api/paper-trading")
        self.assertEqual(status, 404)

        status, _, _ = self.asgi_request(
            "POST",
            "/api/paper-trading/trades",
            {"symbol": "AAPL", "side": "BUY", "quantity": 1},
        )
        self.assertEqual(status, 404)


class ApiReliabilityTests(IsolatedDatabaseTestCase):
    def test_security_headers_are_present(self):
        status, headers, _ = self.asgi_request("GET", "/")

        self.assertEqual(status, 200)
        self.assertEqual(headers["x-content-type-options"], "nosniff")
        self.assertEqual(headers["x-frame-options"], "DENY")
        self.assertEqual(headers["referrer-policy"], "no-referrer")
        self.assertIn("geolocation=()", headers["permissions-policy"])

    def test_stock_endpoint_preserves_not_found_response(self):
        ticker = SimpleNamespace(
            history=lambda **kwargs: pd.DataFrame(),
        )
        with patch.object(stocks.yf, "Ticker", return_value=ticker):
            status, _, body = self.asgi_request("GET", "/api/stocks/UNKNOWN")

        self.assertEqual(status, 404)
        self.assertEqual(body["detail"], "Stock not found")

    def test_technical_endpoint_preserves_not_found_response(self):
        with patch.object(
            stocks.yf,
            "download",
            return_value=pd.DataFrame(),
        ):
            status, _, body = self.asgi_request(
                "GET",
                "/api/technical/UNKNOWN",
            )

        self.assertEqual(status, 404)
        self.assertEqual(body["detail"], "No market data found for UNKNOWN")

    def test_stock_endpoint_reports_insufficient_history(self):
        history = pd.DataFrame(
            {"Close": [100.0]},
            index=pd.to_datetime(["2026-10-01"]),
        )
        ticker = SimpleNamespace(
            history=lambda **kwargs: history,
        )
        with patch.object(stocks.yf, "Ticker", return_value=ticker):
            status, _, body = self.asgi_request("GET", "/api/stocks/AAPL")

        self.assertEqual(status, 422)
        self.assertEqual(
            body["detail"],
            "Not enough historical data to calculate price change.",
        )

    def test_stock_endpoint_does_not_expose_market_provider_errors(self):
        ticker = SimpleNamespace(
            history=lambda **kwargs: (_ for _ in ()).throw(
                RuntimeError("provider credentials or internals")
            ),
        )
        with patch.object(stocks.yf, "Ticker", return_value=ticker):
            status, _, body = self.asgi_request("GET", "/api/stocks/AAPL")

        self.assertEqual(status, 502)
        self.assertEqual(body["detail"], "Market data is temporarily unavailable.")
        self.assertNotIn("provider credentials", body["detail"])

    def test_stock_endpoint_returns_latest_price_and_change(self):
        history = pd.DataFrame(
            {"Close": [100.0, 105.0]},
            index=pd.to_datetime(["2026-10-01", "2026-10-02"]),
        )
        ticker = SimpleNamespace(
            history=lambda **kwargs: history,
        )
        with patch.object(stocks.yf, "Ticker", return_value=ticker):
            status, _, body = self.asgi_request("GET", "/api/stocks/aapl")

        self.assertEqual(status, 200)
        self.assertEqual(body["symbol"], "AAPL")
        self.assertEqual(body["price"], 105)
        self.assertEqual(body["change"], 5)
        self.assertEqual(len(body["history"]), 2)

    def test_prediction_provider_errors_are_not_exposed(self):
        with patch.object(
            prediction,
            "train_xgboost",
            side_effect=RuntimeError("private model failure detail"),
        ):
            status, _, body = self.asgi_request("GET", "/api/prediction/AAPL")

        self.assertEqual(status, 502)
        self.assertEqual(
            body["detail"],
            "XGBoost prediction is temporarily unavailable.",
        )
        self.assertNotIn("private model failure", body["detail"])

    def test_search_provider_errors_are_not_exposed(self):
        with patch.object(
            market_search.yf,
            "Search",
            side_effect=RuntimeError("private provider failure detail"),
        ):
            status, _, body = self.asgi_request(
                "GET",
                "/api/market-search?q=AAPL",
            )

        self.assertEqual(status, 200)
        self.assertFalse(body["success"])
        self.assertEqual(
            body["error"],
            "Market search is temporarily unavailable.",
        )
        self.assertNotIn("private provider failure", body["error"])

    def test_market_search_rejects_excessive_query_length(self):
        status, _, body = self.asgi_request(
            "GET",
            f"/api/market-search?q={'A' * 101}",
        )

        self.assertEqual(status, 422)
        self.assertIn("String should have at most 100 characters", body["detail"][0]["msg"])


class ProductionConfigurationTests(unittest.TestCase):
    def test_accepts_valid_https_origins(self):
        from app.main import validate_production_origins

        validate_production_origins(["https://stocks.example.com", "https://localhost:8443"])

    def test_rejects_non_origin_or_insecure_values(self):
        from app.main import validate_production_origins

        with self.assertRaises(RuntimeError):
            validate_production_origins([])

        invalid_origins = (
            "http://stocks.example.com",
            "https://stocks.example.com/path",
            "https://user@stocks.example.com",
            "https://stocks.example.com?debug=true",
            "https://stocks.example.com:",
            "https://stocks.example.com:bad",
        )
        for origin in invalid_origins:
            with self.subTest(origin=origin), self.assertRaises(RuntimeError):
                validate_production_origins([origin])


if __name__ == "__main__":
    unittest.main()
