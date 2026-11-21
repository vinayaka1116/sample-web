# backend/app/portfolio.py

from pathlib import Path
from contextlib import contextmanager
import hashlib
import secrets
import sqlite3
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field

from app.auth import get_current_user

router = APIRouter()

DB_PATH = Path(__file__).resolve().parent.parent / "portfolio.db"


@contextmanager
def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
    finally:
        connection.close()


def init_db():
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS portfolio (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                name TEXT NOT NULL,
                symbol TEXT NOT NULL,
                short TEXT,
                color TEXT,
                quantity REAL NOT NULL,
                buy_price REAL NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_portfolio_email_symbol
            ON portfolio(email, symbol)
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS portfolio_shares (
                token_hash TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                created_at INTEGER NOT NULL
            )
            """
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_portfolio_shares_email ON portfolio_shares(email)"
        )

        connection.commit()


init_db()


class PortfolioItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    symbol: str = Field(min_length=1, max_length=32)
    short: Optional[str] = ""
    color: Optional[str] = "blue"
    quantity: float = Field(gt=0, allow_inf_nan=False)
    buy_price: float = Field(gt=0, allow_inf_nan=False)


class PortfolioShareLookup(BaseModel):
    token: str = Field(min_length=20, max_length=128)


@router.get("")
def get_portfolio(
    response: Response,
    user=Depends(get_current_user),
):
    response.headers["Cache-Control"] = "no-store"
    clean_email = user["email"]

    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT
                MIN(id) AS id,
                name,
                symbol,
                MAX(short) AS short,
                MAX(color) AS color,
                SUM(quantity) AS quantity,
                CASE
                    WHEN SUM(quantity) > 0
                    THEN SUM(quantity * buy_price) / SUM(quantity)
                    ELSE 0
                END AS buy_price,
                MIN(created_at) AS created_at
            FROM portfolio
            WHERE email = ?
            GROUP BY email, symbol
            ORDER BY MIN(id) DESC
            """,
            (clean_email,),
        ).fetchall()

    return {
        "success": True,
        "email": clean_email,
        "portfolio": [dict(row) for row in rows],
    }


@router.post("")
def add_portfolio_item(
    item: PortfolioItemCreate,
    user=Depends(get_current_user),
):
    clean_email = user["email"]
    clean_symbol = item.symbol.strip().upper()

    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO portfolio
            (
                email,
                name,
                symbol,
                short,
                color,
                quantity,
                buy_price
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                clean_email,
                item.name.strip(),
                clean_symbol,
                item.short or "",
                item.color or "blue",
                item.quantity,
                item.buy_price,
            ),
        )

        connection.commit()

        row = connection.execute(
            """
            SELECT
                MIN(id) AS id,
                name,
                symbol,
                MAX(short) AS short,
                MAX(color) AS color,
                SUM(quantity) AS quantity,
                CASE
                    WHEN SUM(quantity) > 0
                    THEN SUM(quantity * buy_price) / SUM(quantity)
                    ELSE 0
                END AS buy_price,
                MIN(created_at) AS created_at
            FROM portfolio
            WHERE email = ?
            AND symbol = ?
            GROUP BY email, symbol
            """,
            (clean_email, clean_symbol),
        ).fetchone()

    return {
        "success": True,
        "item": dict(row),
        "message": "Stock added and holding consolidated",
    }


@router.post("/share")
def create_portfolio_share(user=Depends(get_current_user)):
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    with get_connection() as connection:
        connection.execute(
            "DELETE FROM portfolio_shares WHERE email = ?",
            (user["email"],)
        )
        connection.execute(
            "INSERT INTO portfolio_shares (token_hash, email, created_at) VALUES (?, ?, ?)",
            (token_hash, user["email"], int(time.time()))
        )
        connection.commit()
    return {
        "success": True,
        "share_token": token,
        "message": "Read-only portfolio share created. Previous share links have been revoked."
    }


@router.delete("/share")
def revoke_portfolio_share(user=Depends(get_current_user)):
    with get_connection() as connection:
        connection.execute(
            "DELETE FROM portfolio_shares WHERE email = ?",
            (user["email"],)
        )
        connection.commit()
    return {"success": True, "message": "Portfolio share links revoked."}


@router.delete("/{symbol}")
def delete_portfolio_stock(
    symbol: str,
    user=Depends(get_current_user),
):
    clean_email = user["email"]
    clean_symbol = symbol.strip().upper()

    with get_connection() as connection:
        cursor = connection.execute(
            """
            DELETE FROM portfolio
            WHERE email = ?
            AND symbol = ?
            """,
            (clean_email, clean_symbol),
        )

        connection.commit()

    if cursor.rowcount == 0:
        raise HTTPException(
            status_code=404,
            detail="Portfolio stock not found",
        )

    return {
        "success": True,
        "message": "Stock removed from portfolio",
        "symbol": clean_symbol,
    }


@router.post("/shared")
def get_shared_portfolio(share: PortfolioShareLookup, response: Response):
    response.headers["Cache-Control"] = "no-store"
    token_hash = hashlib.sha256(share.token.encode("utf-8")).hexdigest()
    with get_connection() as connection:
        share = connection.execute(
            "SELECT email FROM portfolio_shares WHERE token_hash = ?",
            (token_hash,)
        ).fetchone()
        if share is None:
            raise HTTPException(status_code=404, detail="Share link is invalid or has been revoked.")
        rows = connection.execute(
            """
            SELECT
                MIN(id) AS id,
                name,
                symbol,
                MAX(short) AS short,
                MAX(color) AS color,
                SUM(quantity) AS quantity,
                CASE
                    WHEN SUM(quantity) > 0
                    THEN SUM(quantity * buy_price) / SUM(quantity)
                    ELSE 0
                END AS buy_price
            FROM portfolio
            WHERE email = ?
            GROUP BY email, symbol
            ORDER BY MIN(id) DESC
            """,
            (share["email"],)
        ).fetchall()
    return {"portfolio": [dict(row) for row in rows]}