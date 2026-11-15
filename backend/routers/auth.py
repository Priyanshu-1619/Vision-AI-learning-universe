"""
Authentication router — Secure, pure-local user management and guest-to-account upgrade.
Zero external AI APIs or cloud authentication dependencies.
Uses PBKDF2-HMAC-SHA256 password hashing and persistent SQLite storage.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
from pathlib import Path
from typing import Any, Dict, Optional
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/auth", tags=["auth"])

DATA_DIR = Path(os.environ.get("DATA_DIR", Path(__file__).resolve().parent.parent / "data"))
DB_PATH = DATA_DIR / "learner_progress.db"
SECRET_KEY = os.environ.get("AUTH_SECRET_KEY", "ailu_master_secret_key_space_universe_2026")


def get_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS learner_progress (
                user_id TEXT NOT NULL,
                topic_id TEXT NOT NULL,
                domain TEXT,
                status TEXT,
                record_json TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, topic_id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS math_progress (
                user_id TEXT NOT NULL,
                math_id TEXT NOT NULL,
                status TEXT,
                record_json TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, math_id)
            )
        """)
    return conn


def hash_password(password: str, salt: str) -> str:
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return dk.hex()


def create_token(user_id: str, email: str) -> str:
    payload = f"{user_id}:{email}:{secrets.token_hex(8)}"
    signature = hmac.new(SECRET_KEY.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload}:{signature}"


def verify_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(":")
        if len(parts) != 4:
            return None
        user_id, email, nonce, sig = parts
        expected = f"{user_id}:{email}:{nonce}"
        computed_sig = hmac.new(SECRET_KEY.encode("utf-8"), expected.encode("utf-8"), hashlib.sha256).hexdigest()
        if hmac.compare_digest(sig, computed_sig):
            return {"user_id": user_id, "email": email}
        return None
    except Exception:
        return None


# ── Schemas ─────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: str = Field(default="", alias="displayName")
    guest_progress: Dict[str, Any] = Field(default_factory=dict, alias="guestProgress")
    guest_math_progress: Dict[str, Any] = Field(default_factory=dict, alias="guestMathProgress")

    model_config = {"populate_by_name": True}


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    user_id: str = Field(alias="userId")
    email: str
    display_name: str = Field(alias="displayName")
    is_guest: bool = Field(default=False, alias="isGuest")

    model_config = {"populate_by_name": True}


class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    transferred_topics: int = Field(default=0, alias="transferredTopics")


# ── Endpoints ───────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    email = req.email.strip().lower()
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        raise HTTPException(status_code=400, detail="Invalid email address format.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    display_name = req.display_name.strip() or email.split("@")[0].title()
    user_id = f"user_{secrets.token_hex(6)}"
    salt = secrets.token_hex(16)
    pw_hash = hash_password(req.password, salt)

    conn = get_db()
    try:
        with conn:
            conn.execute(
                "INSERT INTO users (user_id, email, display_name, password_hash, salt) VALUES (?, ?, ?, ?, ?)",
                (user_id, email, display_name, pw_hash, salt)
            )
            # Transfer guest progress if provided
            transferred = 0
            for topic_id, record in req.guest_progress.items():
                domain = record.get("domain", "")
                status_val = record.get("status", "completed")
                rec_copy = dict(record)
                rec_copy["userId"] = user_id
                conn.execute("""
                    INSERT INTO learner_progress (user_id, topic_id, domain, status, record_json, updated_at)
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(user_id, topic_id) DO NOTHING
                """, (user_id, topic_id, domain, status_val, json.dumps(rec_copy)))
                transferred += 1

            for math_id, m_record in req.guest_math_progress.items():
                m_status = m_record.get("status", "completed")
                m_rec_copy = dict(m_record)
                m_rec_copy["userId"] = user_id
                conn.execute("""
                    INSERT INTO math_progress (user_id, math_id, status, record_json, updated_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(user_id, math_id) DO NOTHING
                """, (user_id, math_id, m_status, json.dumps(m_rec_copy)))
                transferred += 1

    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(exc)}")

    token = create_token(user_id, email)
    return AuthResponse(
        user=UserResponse(userId=user_id, email=email, displayName=display_name, isGuest=False),
        token=token,
        transferredTopics=transferred
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    email = req.email.strip().lower()
    conn = get_db()
    with conn:
        cur = conn.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    expected_hash = hash_password(req.password, row["salt"])
    if not hmac.compare_digest(row["password_hash"], expected_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_token(row["user_id"], row["email"])
    return AuthResponse(
        user=UserResponse(
            userId=row["user_id"],
            email=row["email"],
            displayName=row["display_name"],
            isGuest=False
        ),
        token=token,
        transferredTopics=0
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    token = authorization.split(" ")[1]
    verified = verify_token(token)
    if not verified:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")

    conn = get_db()
    with conn:
        cur = conn.execute("SELECT user_id, email, display_name FROM users WHERE user_id = ?", (verified["user_id"],))
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="User not found.")

    return UserResponse(
        userId=row["user_id"],
        email=row["email"],
        displayName=row["display_name"],
        isGuest=False
    )
