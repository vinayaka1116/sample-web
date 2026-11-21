from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv
import os
import sqlite3
import hashlib
import secrets
import time
from pathlib import Path

router = APIRouter()

DB_PATH = Path(__file__).resolve().parent.parent / "stockai_users.db"
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
SESSION_LIFETIME_SECONDS = 12 * 60 * 60
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").strip().lower() == "true"
SESSION_COOKIE_NAME = "__Host-stockai_session" if SESSION_COOKIE_SECURE else "stockai_session"
SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "lax").strip().lower()
if SESSION_COOKIE_SAMESITE not in {"lax", "strict", "none"}:
    raise RuntimeError("SESSION_COOKIE_SAMESITE must be lax, strict, or none.")
if SESSION_COOKIE_SAMESITE == "none" and not SESSION_COOKIE_SECURE:
    raise RuntimeError("SameSite=None session cookies require SESSION_COOKIE_SECURE=true.")
if os.getenv("APP_ENV", "development").strip().lower() == "production" and not SESSION_COOKIE_SECURE:
    raise RuntimeError("Production requires SESSION_COOKIE_SECURE=true.")


# =========================================================
# DATABASE
# =========================================================

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            age_confirmed_at INTEGER,
            terms_accepted_at INTEGER
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE,
            expires_at INTEGER NOT NULL,
            used INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            token_hash TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)"
    )

    user_columns = {
        row["name"] for row in conn.execute("PRAGMA table_info(users)")
    }
    if "age_confirmed_at" not in user_columns:
        conn.execute("ALTER TABLE users ADD COLUMN age_confirmed_at INTEGER")
    if "terms_accepted_at" not in user_columns:
        conn.execute("ALTER TABLE users ADD COLUMN terms_accepted_at INTEGER")

    conn.commit()
    conn.close()


def hash_password(password, salt=None):

    if salt is None:
        salt = secrets.token_bytes(16)

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        120000
    )

    return salt.hex(), password_hash.hex()


init_db()


def verify_password(password, salt_hex, stored_hash):

    _, new_hash = hash_password(
        password,
        bytes.fromhex(salt_hex)
    )

    return secrets.compare_digest(
        new_hash,
        stored_hash
    )


# =========================================================
# USER RESPONSE
# =========================================================

def user_data(row):

    parts = row["name"].strip().split()

    initials = "".join(
        part[0]
        for part in parts[:2]
    ).upper()

    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "initials": initials or "U"
    }


# =========================================================
# REQUEST MODELS
# =========================================================

class RegisterRequest(BaseModel):

    name: str
    email: EmailStr
    password: str = Field(min_length=12, max_length=256)
    age_confirmed: bool = False
    terms_accepted: bool = False


class LoginRequest(BaseModel):

    email: EmailStr
    password: str = Field(min_length=1, max_length=256)


class ForgotPasswordRequest(BaseModel):

    email: EmailStr


class ResetPasswordRequest(BaseModel):

    email: EmailStr
    token: str
    new_password: str


def issue_session(conn, user_id):
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    expires_at = int(time.time()) + SESSION_LIFETIME_SECONDS
    conn.execute(
        "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
        (token_hash, user_id, expires_at)
    )
    return token


def get_current_user(request: Request):
    token = request.cookies.get(SESSION_COOKIE_NAME, "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")

    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    conn = get_db()
    try:
        row = conn.execute(
            """
            SELECT users.id, users.name, users.email
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token_hash = ? AND sessions.expires_at > ?
            """,
            (token_hash, int(time.time()))
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        raise HTTPException(status_code=401, detail="Session is invalid or expired.")
    return user_data(row)


def create_user_session(conn, row, response: Response):
    token = issue_session(conn, row["id"])
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=SESSION_LIFETIME_SECONDS,
        httponly=True,
        secure=SESSION_COOKIE_SECURE,
        samesite=SESSION_COOKIE_SAMESITE,
        path="/",
    )
    response.headers["Cache-Control"] = "no-store"
    return {
        "success": True,
        "message": "Signed in successfully.",
        "user": user_data(row),
        "expires_in": SESSION_LIFETIME_SECONDS
    }


# =========================================================
# REGISTER
# =========================================================

@router.post("/register")
def register(data: RegisterRequest, response: Response):

    name = data.name.strip()
    email = str(data.email).strip().lower()

    if email == "admin@stockai.com":
        raise HTTPException(
            status_code=400,
            detail="The built-in demo account is disabled. Register with a different email."
        )

    if len(name) < 2:

        raise HTTPException(
            status_code=400,
            detail="Please enter your full name."
        )

    if len(data.password) < 12:

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 12 characters."
        )

    if not data.age_confirmed:
        raise HTTPException(
            status_code=400,
            detail="You must confirm that you are at least 18 years old."
        )

    if not data.terms_accepted:
        raise HTTPException(
            status_code=400,
            detail="You must accept the Terms & Conditions to create an account."
        )

    conn = get_db()

    existing = conn.execute(
        "SELECT id FROM users WHERE email = ?",
        (email,)
    ).fetchone()

    if existing:

        conn.close()

        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    salt, password_hash = hash_password(
        data.password
    )
    accepted_at = int(time.time())

    cursor = conn.execute(
        """
        INSERT INTO users
        (name, email, password_hash, salt, created_at, age_confirmed_at, terms_accepted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            name,
            email,
            password_hash,
            salt,
            accepted_at,
            accepted_at,
            accepted_at
        )
    )

    conn.commit()

    row = conn.execute(
        "SELECT * FROM users WHERE id = ?",
        (cursor.lastrowid,)
    ).fetchone()

    result = create_user_session(conn, row, response)
    conn.commit()
    conn.close()

    result["message"] = "Account created successfully."
    return result


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
def login(data: LoginRequest, response: Response):

    email = str(data.email).strip().lower()

    conn = get_db()

    row = conn.execute(
        "SELECT * FROM users WHERE email = ?",
        (email,)
    ).fetchone()

    conn.close()

    if not row:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    valid = verify_password(
        data.password,
        row["salt"],
        row["password_hash"]
    )

    if not valid:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    if email == "admin@stockai.com":
        raise HTTPException(
            status_code=401,
            detail="The demo account is disabled. Register a new account instead."
        )

    conn = get_db()
    try:
        result = create_user_session(conn, row, response)
        conn.commit()
    finally:
        conn.close()
    return result


@router.get("/me")
def get_me(response: Response, user=Depends(get_current_user)):
    response.headers["Cache-Control"] = "no-store"
    return {"success": True, "user": user}


@router.post("/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get(SESSION_COOKIE_NAME, "").strip()
    conn = get_db()
    try:
        if token:
            token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
            conn.execute(
                "DELETE FROM sessions WHERE token_hash = ?",
                (token_hash,)
            )
        conn.commit()
    finally:
        conn.close()
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=SESSION_COOKIE_SECURE,
        samesite=SESSION_COOKIE_SAMESITE,
    )
    response.headers["Cache-Control"] = "no-store"
    return {"success": True, "message": "Signed out successfully."}


# =========================================================
# FORGOT PASSWORD
# =========================================================

@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest
):
    raise HTTPException(
        status_code=503,
        detail="Password recovery is unavailable until a verified email delivery provider is configured."
    )


# =========================================================
# RESET PASSWORD
# =========================================================

@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest
):
    raise HTTPException(
        status_code=503,
        detail="Password recovery is unavailable until a verified email delivery provider is configured."
    )