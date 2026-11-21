import os
from urllib.parse import urlsplit

from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes import stocks
from app.routes import technical
from app.routes import risk
from app.routes import prediction
from app.auth import router as auth_router
from app.market_search import search_stocks
from app.portfolio import router as portfolio_router


app = FastAPI(
    title="StockAI Intelligence API",
    description="AI-Based Stock Market Analytics, Prediction & Investment Intelligence System",
    version="1.0.0"
)


allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "APP_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
is_production = os.getenv("APP_ENV", "development").strip().lower() == "production"


def validate_production_origins(origins):
    if not origins:
        raise RuntimeError("Production requires at least one HTTPS CORS origin.")

    for origin in origins:
        try:
            parsed = urlsplit(origin)
            parsed.port
        except ValueError as exc:
            raise RuntimeError("Production CORS origins must be valid HTTPS origins.") from exc

        if (
            origin != origin.strip()
            or any(character.isspace() for character in origin)
            or parsed.scheme != "https"
            or not parsed.hostname
            or parsed.username is not None
            or parsed.password is not None
            or parsed.path
            or parsed.query
            or parsed.fragment
            or parsed.netloc.endswith(":")
        ):
            raise RuntimeError("Production CORS origins must be valid HTTPS origins.")


if is_production:
    validate_production_origins(allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"]
)


@app.middleware("http")
async def browser_security_middleware(request: Request, call_next):
    if (
        request.url.path.startswith("/api/")
        and request.method in {"POST", "PUT", "PATCH", "DELETE"}
        and request.headers.get("origin") not in allowed_origins
    ):
        return JSONResponse(
            status_code=403,
            content={"detail": "Request origin is not allowed."},
        )

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"]
)


app.include_router(
    stocks.router,
    prefix="/api/stocks",
    tags=["Stocks"]
)


app.include_router(
    technical.router,
    prefix="/api/technical",
    tags=["Technical Analysis"]
)


app.include_router(
    risk.router,
    prefix="/api/risk",
    tags=["Risk Analysis"]
)


app.include_router(
    prediction.router,
    prefix="/api/prediction",
    tags=["AI Prediction"]
)


app.include_router(
    portfolio_router,
    prefix="/api/portfolio",
    tags=["Portfolio"]
)

@app.get(
    "/api/market-search",
    tags=["Market Search"]
)
def market_search(q: str = Query(max_length=100)):
    return search_stocks(q)


@app.get("/")
def home():
    return {
        "message": "StockAI API Running",
        "status": "success"
    }