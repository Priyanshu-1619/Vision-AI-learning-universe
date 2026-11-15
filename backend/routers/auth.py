"""
Authentication router — Secure user management, bcrypt password hashing,
email OTP password recovery, rate-limited account protection, and persistent sessions.
Zero external AI APIs or paid authentication dependencies.
"""
from __future__ import annotations

import datetime
import hashlib
import hmac
import json
import logging
import os
import re
import secrets
import sqlite3
from pathlib import Path
from typing import Any, Dict, Optional

import bcrypt
from fastapi import APIRouter, Cookie, Header, HTTPException, Request, Response, status
from pydantic import BaseModel, Field

from services import email_service

logger = logging.getLogger("ailu.auth")

router = APIRouter(prefix="/api/auth", tags=["auth"])

DATA_DIR = Path(os.environ.get("DATA_DIR", Path(__file__).resolve().parent.parent / "data"))
DB_PATH = DATA_DIR / "learner_progress.db"
SECRET_KEY = os.environ.get("AUTH_SECRET_KEY", "ailu_master_secret_key_space_universe_2026")
IS_PRODUCTION = os.environ.get("RENDER", "") != "" or os.environ.get("NODE_ENV") == "production"

# Rate limiting settings
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
OTP_EXPIRY_MINUTES = 5
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60
RESET_TOKEN_EXPIRY_MINUTES = 10
SESSION_EXPIRY_DAYS = 30


# ── Database Migration & Connection ─────────────────────────────────

def get_db() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    migrate_db(conn)
    return conn


def migrate_db(conn: sqlite3.Connection) -> None:
    """Safely migrate database schema preserving all existing users and progress."""
    with conn:
        # Base users table if starting fresh
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

        # Inspect columns in users table
        cur = conn.execute("PRAGMA table_info(users)")
        columns = [row["name"] for row in cur.fetchall()]

        new_columns = [
            ("full_name", "TEXT"),
            ("username", "TEXT"),
            ("normalized_username", "TEXT"),
            ("normalized_email", "TEXT"),
            ("is_active", "INTEGER DEFAULT 1"),
            ("failed_login_attempts", "INTEGER DEFAULT 0"),
            ("locked_until", "TIMESTAMP DEFAULT NULL"),
            ("updated_at", "TIMESTAMP DEFAULT NULL"),
            ("last_login_at", "TIMESTAMP DEFAULT NULL"),
        ]

        for col_name, col_type in new_columns:
            if col_name not in columns:
                try:
                    conn.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                except Exception as e:
                    logger.debug("Column %s already present or error: %s", col_name, e)

        # Backfill normalized fields for any legacy users
        conn.execute("""
            UPDATE users
            SET normalized_email = LOWER(TRIM(email))
            WHERE normalized_email IS NULL OR normalized_email = ''
        """)
        conn.execute("""
            UPDATE users
            SET full_name = display_name
            WHERE full_name IS NULL OR full_name = ''
        """)
        conn.execute("""
            UPDATE users
            SET username = COALESCE(NULLIF(username, ''), SUBSTR(email, 1, INSTR(email, '@') - 1))
            WHERE username IS NULL OR username = ''
        """)
        conn.execute("""
            UPDATE users
            SET normalized_username = LOWER(TRIM(username))
            WHERE normalized_username IS NULL OR normalized_username = ''
        """)

        # Indexes for fast and unique lookups
        conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_users_norm_username
            ON users(normalized_username) WHERE normalized_username IS NOT NULL
        """)
        conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_users_norm_email
            ON users(normalized_email)
        """)

        # Password reset OTP table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS password_reset_otps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                otp_hash TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                attempts INTEGER DEFAULT 0,
                resend_count INTEGER DEFAULT 0,
                used_at TIMESTAMP DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(user_id)
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_otps_user ON password_reset_otps(user_id, expires_at)
        """)

        # Password reset token table (for verified reset phase)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                token_hash TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used_at TIMESTAMP DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(user_id)
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id)
        """)

        # Authenticated sessions table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                user_agent TEXT,
                FOREIGN KEY(user_id) REFERENCES users(user_id)
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)
        """)

        # Learner progress tables
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


# ── Password & Validation Helpers ────────────────────────────────────

def hash_password_bcrypt(password: str) -> str:
    """Hash password with bcrypt using 12 salt rounds."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def hash_password_legacy(password: str, salt: str) -> str:
    """Legacy PBKDF2 hash for seamless backward compatibility."""
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return dk.hex()


def verify_password(plain_password: str, stored_hash: str, salt: str = "") -> bool:
    """Verify password constant-time; supports bcrypt and legacy PBKDF2."""
    if stored_hash.startswith(("$2a$", "$2b$", "$2y$")):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), stored_hash.encode("utf-8"))
        except Exception:
            return False
    # Legacy PBKDF2
    expected = hash_password_legacy(plain_password, salt)
    return hmac.compare_digest(stored_hash, expected)


def validate_username(username: str) -> str:
    """Validate username rules; returns stripped original username."""
    u = username.strip()
    if len(u) < 3 or len(u) > 30:
        raise HTTPException(
            status_code=400,
            detail="Username must be between 3 and 30 characters in length."
        )
    if not re.match(r"^[a-zA-Z0-9_-]+$", u):
        raise HTTPException(
            status_code=400,
            detail="Username may only contain letters, numbers, underscores (_), and hyphens (-)."
        )
    return u


def validate_email_format(email: str) -> str:
    """Validate and normalize email."""
    e = email.strip().lower()
    if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", e):
        raise HTTPException(status_code=400, detail="Invalid email address format.")
    return e


def validate_password_policy(password: str, username: str, email: str) -> None:
    """
    Enforce security policy:
    - Min 8 characters
    - At least 1 uppercase, 1 lowercase, 1 digit, 1 special character
    - Must not contain username or email local part as substring
    """
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter (A-Z).")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter (a-z).")
    if not re.search(r"[0-9]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number (0-9).")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_+=\[\]\\/'`~;]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one special character (!@#$%^&*...)."
        )

    # Substring check for username
    u_norm = username.strip().lower()
    if u_norm and u_norm in password.lower():
        raise HTTPException(status_code=400, detail="Password must not contain your username.")

    # Substring check for email local part
    if "@" in email:
        local_part = email.split("@")[0].strip().lower()
        if len(local_part) >= 3 and local_part in password.lower():
            raise HTTPException(status_code=400, detail="Password must not contain your email prefix.")


def hash_otp(user_id: str, otp: str) -> str:
    """Secure hash for storing OTP."""
    payload = f"{user_id}:{otp}:{SECRET_KEY}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def hash_token(token: str) -> str:
    """Secure hash for reset tokens and session IDs."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# ── Schemas ─────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str = Field(default="", alias="fullName")
    username: str
    email: str
    password: str
    confirm_password: str = Field(default="", alias="confirmPassword")
    display_name: str = Field(default="", alias="displayName")
    guest_progress: Dict[str, Any] = Field(default_factory=dict, alias="guestProgress")
    guest_math_progress: Dict[str, Any] = Field(default_factory=dict, alias="guestMathProgress")

    model_config = {"populate_by_name": True}


class LoginRequest(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class VerifyOtpRequest(BaseModel):
    email: str
    otp: str


class ResetPasswordRequest(BaseModel):
    reset_token: str = Field(alias="resetToken")
    new_password: str = Field(alias="newPassword")
    confirm_password: str = Field(alias="confirmPassword")

    model_config = {"populate_by_name": True}


class UserResponse(BaseModel):
    user_id: str = Field(alias="userId")
    username: str
    email: str
    full_name: str = Field(alias="fullName")
    display_name: str = Field(alias="displayName")
    is_guest: bool = Field(default=False, alias="isGuest")

    model_config = {"populate_by_name": True}


class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    transferred_topics: int = Field(default=0, alias="transferredTopics")

    model_config = {"populate_by_name": True}


class GenericResponse(BaseModel):
    success: bool = True
    message: str


# ── Session Helpers ──────────────────────────────────────────────────

def create_user_session(conn: sqlite3.Connection, user_id: str, request: Optional[Request] = None) -> str:
    """Create a new session record in DB and return secure session token."""
    session_id = f"sess_{secrets.token_urlsafe(36)}"
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=SESSION_EXPIRY_DAYS)
    ip_addr = request.client.host if (request and request.client) else "127.0.0.1"
    ua = request.headers.get("user-agent", "") if request else ""

    with conn:
        conn.execute(
            "INSERT INTO sessions (session_id, user_id, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
            (session_id, user_id, expires_at.isoformat(), ip_addr, ua)
        )
    return session_id


def set_session_cookie(response: Response, session_id: str) -> None:
    """Attach secure HTTP-only cookie."""
    response.set_cookie(
        key="ailu_session",
        value=session_id,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        max_age=SESSION_EXPIRY_DAYS * 86400,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    """Clear HTTP-only session cookie."""
    response.delete_cookie(
        key="ailu_session",
        path="/",
        httponly=True,
        samesite="lax",
    )


def resolve_session_user(
    conn: sqlite3.Connection,
    cookie_session: Optional[str] = None,
    bearer_header: Optional[str] = None,
) -> Optional[sqlite3.Row]:
    """Resolve authenticated user from Bearer token header or HTTP-only cookie."""
    token = None
    if bearer_header and bearer_header.startswith("Bearer "):
        token = bearer_header[7:].strip()
    elif cookie_session:
        token = cookie_session.strip()

    if not token:
        return None

    now_iso = datetime.datetime.utcnow().isoformat()

    # Check sessions table first
    with conn:
        cur = conn.execute("""
            SELECT u.* FROM sessions s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.session_id = ? AND s.expires_at > ?
        """, (token, now_iso))
        row = cur.fetchone()
        if row:
            return row

    # Legacy HMAC token check if migrating existing user
    if ":" in token:
        parts = token.split(":")
        if len(parts) == 4:
            uid, uemail, nonce, sig = parts
            expected = f"{uid}:{uemail}:{nonce}"
            computed = hmac.new(SECRET_KEY.encode(), expected.encode(), hashlib.sha256).hexdigest()
            if hmac.compare_digest(sig, computed):
                cur = conn.execute("SELECT * FROM users WHERE user_id = ?", (uid,))
                return cur.fetchone()

    return None


# ── Endpoints ───────────────────────────────────────────────────────

@router.get("/check-username")
async def check_username(username: str = ""):
    """Check whether a username is available (case-insensitive)."""
    raw_u = username.strip()
    if len(raw_u) < 3:
        return {"available": False, "username": raw_u, "reason": "Must be at least 3 characters."}
    if len(raw_u) > 30:
        return {"available": False, "username": raw_u, "reason": "Cannot exceed 30 characters."}
    if not re.match(r"^[a-zA-Z0-9_-]+$", raw_u):
        return {"available": False, "username": raw_u, "reason": "Letters, numbers, underscores, and hyphens only."}

    norm_u = raw_u.lower()
    conn = get_db()
    with conn:
        cur = conn.execute("SELECT user_id FROM users WHERE normalized_username = ?", (norm_u,))
        exists = cur.fetchone() is not None

    if exists:
        return {"available": False, "username": raw_u, "reason": "This username is already taken."}
    return {"available": True, "username": raw_u, "reason": "Username is available!"}


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest, response: Response, request: Request):
    """Register a new user account with unique username, email, and bcrypt password."""
    username = validate_username(req.username)
    norm_username = username.lower()
    email = validate_email_format(req.email)
    norm_email = email.lower()

    full_name = req.full_name.strip() or req.display_name.strip() or username
    display_name = full_name

    # Confirm password check if provided
    if req.confirm_password and req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Password and confirm password do not match.")

    # Password policy check
    validate_password_policy(req.password, username, email)

    conn = get_db()

    # Case-insensitive uniqueness checks
    with conn:
        cur = conn.execute("SELECT user_id FROM users WHERE normalized_username = ?", (norm_username,))
        if cur.fetchone():
            raise HTTPException(
                status_code=409,
                detail="This username is already taken. Please choose another username."
            )

        cur = conn.execute("SELECT user_id FROM users WHERE normalized_email = ?", (norm_email,))
        if cur.fetchone():
            raise HTTPException(
                status_code=409,
                detail="An account with this email address already exists. Please log in or reset your password."
            )

    # Hash with bcrypt
    pw_hash = hash_password_bcrypt(req.password)
    user_id = f"user_{secrets.token_hex(8)}"
    salt = secrets.token_hex(16)

    try:
        with conn:
            conn.execute("""
                INSERT INTO users (
                    user_id, email, display_name, full_name, username,
                    normalized_username, normalized_email, password_hash, salt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, email, display_name, full_name, username,
                norm_username, norm_email, pw_hash, salt
            ))

            # Transfer guest progress
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

            session_id = create_user_session(conn, user_id, request)

    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="An account with this username or email already exists.")
    except Exception as exc:
        logger.error("Registration error: %s", exc)
        raise HTTPException(status_code=500, detail="Registration could not be completed.")

    set_session_cookie(response, session_id)

    return AuthResponse(
        user=UserResponse(
            userId=user_id,
            username=username,
            email=email,
            fullName=full_name,
            displayName=display_name,
            isGuest=False,
        ),
        token=session_id,
        transferredTopics=transferred,
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, response: Response, request: Request):
    """Log in using username OR email with brute-force rate-limiting and temporary account lockout."""
    raw_ident = (req.identifier or req.email or "").strip()
    if not raw_ident:
        raise HTTPException(status_code=400, detail="Please enter your username or email address.")
    if not req.password:
        raise HTTPException(status_code=400, detail="Please enter your password.")

    norm_ident = raw_ident.lower()
    conn = get_db()

    with conn:
        cur = conn.execute("""
            SELECT * FROM users
            WHERE normalized_username = ? OR normalized_email = ? OR email = ?
        """, (norm_ident, norm_ident, raw_ident))
        user = cur.fetchone()

    # If user exists, check lockout
    if user:
        locked_until_str = user["locked_until"]
        if locked_until_str:
            try:
                locked_until = datetime.datetime.fromisoformat(locked_until_str)
                now_utc = datetime.datetime.utcnow()
                if locked_until > now_utc:
                    mins_left = max(1, int((locked_until - now_utc).total_seconds() / 60) + 1)
                    raise HTTPException(
                        status_code=status.HTTP_423_LOCKED,
                        detail=f"Account is temporarily locked due to multiple failed login attempts. Please try again in {mins_left} minute(s) or reset your password."
                    )
            except ValueError:
                pass

    # Verify password
    valid = False
    if user:
        valid = verify_password(req.password, user["password_hash"], user["salt"])

    if not user or not valid:
        # Increment failed attempts on existing user
        if user:
            failed_count = (user["failed_login_attempts"] or 0) + 1
            new_locked_until = None
            if failed_count >= MAX_LOGIN_ATTEMPTS:
                new_locked_until = (
                    datetime.datetime.utcnow() + datetime.timedelta(minutes=LOCKOUT_MINUTES)
                ).isoformat()

            with conn:
                conn.execute("""
                    UPDATE users
                    SET failed_login_attempts = ?, locked_until = ?
                    WHERE user_id = ?
                """, (failed_count, new_locked_until, user["user_id"]))

            if failed_count >= MAX_LOGIN_ATTEMPTS:
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail=f"Account has been temporarily locked for {LOCKOUT_MINUTES} minutes due to multiple failed login attempts. Please reset your password or try again later."
                )

        # Standard generic error to prevent enumeration
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    # Success: reset failed attempts & upgrade legacy hash to bcrypt if needed
    user_id = user["user_id"]
    now_iso = datetime.datetime.utcnow().isoformat()

    with conn:
        if not user["password_hash"].startswith(("$2a$", "$2b$", "$2y$")):
            new_bcrypt_hash = hash_password_bcrypt(req.password)
            conn.execute("""
                UPDATE users
                SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL, last_login_at = ?
                WHERE user_id = ?
            """, (new_bcrypt_hash, now_iso, user_id))
        else:
            conn.execute("""
                UPDATE users
                SET failed_login_attempts = 0, locked_until = NULL, last_login_at = ?
                WHERE user_id = ?
            """, (now_iso, user_id))

        session_id = create_user_session(conn, user_id, request)

    set_session_cookie(response, session_id)

    uname = user["username"] or user["display_name"] or user["email"].split("@")[0]
    fname = user["full_name"] or user["display_name"] or uname

    return AuthResponse(
        user=UserResponse(
            userId=user_id,
            username=uname,
            email=user["email"],
            fullName=fname,
            displayName=user["display_name"] or fname,
            isGuest=False,
        ),
        token=session_id,
        transferredTopics=0,
    )


@router.post("/forgot-password", response_model=GenericResponse)
async def forgot_password(req: ForgotPasswordRequest):
    """
    Request password reset OTP via email.
    Generates cryptographically random 6-digit numeric OTP, stores hashed copy,
    and returns generic message to prevent account enumeration.
    """
    email_clean = req.email.strip().lower()
    generic_msg = "If an account exists for this email, password reset instructions have been sent."

    if not re.match(r"[^@]+@[^@]+\.[^@]+", email_clean):
        # Return generic success even on invalid format to prevent enumeration
        return GenericResponse(message=generic_msg)

    conn = get_db()
    with conn:
        cur = conn.execute("""
            SELECT * FROM users
            WHERE normalized_email = ? OR email = ?
        """, (email_clean, email_clean))
        user = cur.fetchone()

    if not user:
        return GenericResponse(message=generic_msg)

    user_id = user["user_id"]
    now = datetime.datetime.utcnow()

    with conn:
        # Rate-limiting / cooldown check: 60 seconds between resends
        cur = conn.execute("""
            SELECT created_at FROM password_reset_otps
            WHERE user_id = ?
            ORDER BY id DESC LIMIT 1
        """, (user_id,))
        last_otp = cur.fetchone()

        if last_otp and last_otp["created_at"]:
            try:
                # Handle SQLite TIMESTAMP strings
                created_dt = datetime.datetime.fromisoformat(last_otp["created_at"].replace("Z", ""))
                diff_sec = (now - created_dt).total_seconds()
                if diff_sec < OTP_RESEND_COOLDOWN_SECONDS:
                    # Enforce cooldown silently or via generic response
                    return GenericResponse(
                        message="A verification code was recently sent. Please wait before requesting another."
                    )
            except Exception:
                pass

        # Invalidate any older active OTPs for this user
        conn.execute("""
            UPDATE password_reset_otps
            SET used_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND used_at IS NULL
        """, (user_id,))

        # Generate 6-digit numeric OTP
        raw_otp = f"{secrets.randbelow(900000) + 100000}"
        otp_h = hash_otp(user_id, raw_otp)
        expires_at = now + datetime.timedelta(minutes=OTP_EXPIRY_MINUTES)

        conn.execute("""
            INSERT INTO password_reset_otps (user_id, otp_hash, expires_at, created_at)
            VALUES (?, ?, ?, ?)
        """, (user_id, otp_h, expires_at.isoformat(), now.isoformat()))

    # Dispatch email
    recipient_name = user["full_name"] or user["username"] or user["display_name"] or "Learner"
    email_service.send_password_reset_otp(user["email"], recipient_name, raw_otp)

    return GenericResponse(message=generic_msg)


@router.post("/verify-otp")
async def verify_otp(req: VerifyOtpRequest):
    """
    Verify 6-digit email OTP.
    Returns short-lived single-use password reset authorization token.
    """
    email_clean = req.email.strip().lower()
    otp_clean = req.otp.strip()

    if not re.match(r"^\d{6}$", otp_clean):
        raise HTTPException(status_code=400, detail="Verification code must be exactly 6 numeric digits.")

    conn = get_db()
    with conn:
        cur = conn.execute("""
            SELECT * FROM users
            WHERE normalized_email = ? OR email = ?
        """, (email_clean, email_clean))
        user = cur.fetchone()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

    user_id = user["user_id"]
    now_iso = datetime.datetime.utcnow().isoformat()

    with conn:
        cur = conn.execute("""
            SELECT * FROM password_reset_otps
            WHERE user_id = ? AND used_at IS NULL
            ORDER BY id DESC LIMIT 1
        """, (user_id,))
        otp_record = cur.fetchone()

    if not otp_record:
        raise HTTPException(status_code=400, detail="No active verification code found. Please request a new one.")

    # Check expiration
    if otp_record["expires_at"] < now_iso:
        with conn:
            conn.execute("UPDATE password_reset_otps SET used_at = CURRENT_TIMESTAMP WHERE id = ?", (otp_record["id"],))
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")

    # Check attempts
    if (otp_record["attempts"] or 0) >= OTP_MAX_ATTEMPTS:
        with conn:
            conn.execute("UPDATE password_reset_otps SET used_at = CURRENT_TIMESTAMP WHERE id = ?", (otp_record["id"],))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed verification attempts. Please request a new verification code."
        )

    # Compare hashed OTP
    expected_hash = hash_otp(user_id, otp_clean)
    if not hmac.compare_digest(otp_record["otp_hash"], expected_hash):
        new_attempts = (otp_record["attempts"] or 0) + 1
        with conn:
            conn.execute("UPDATE password_reset_otps SET attempts = ? WHERE id = ?", (new_attempts, otp_record["id"]))
        remaining = max(0, OTP_MAX_ATTEMPTS - new_attempts)
        raise HTTPException(
            status_code=400,
            detail=f"Incorrect verification code. {remaining} attempt(s) remaining."
        )

    # Success: Mark OTP as used and issue single-use reset token
    reset_token = f"rst_{secrets.token_urlsafe(32)}"
    token_h = hash_token(reset_token)
    token_expiry = (datetime.datetime.utcnow() + datetime.timedelta(minutes=RESET_TOKEN_EXPIRY_MINUTES)).isoformat()

    with conn:
        conn.execute("UPDATE password_reset_otps SET used_at = CURRENT_TIMESTAMP WHERE id = ?", (otp_record["id"],))
        conn.execute("""
            INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
            VALUES (?, ?, ?)
        """, (token_h, user_id, token_expiry))

    return {
        "success": True,
        "resetToken": reset_token,
        "message": "Verification successful. You may now enter your new password.",
    }


@router.post("/reset-password", response_model=GenericResponse)
async def reset_password(req: ResetPasswordRequest):
    """
    Reset password using verified single-use authorization token.
    Validates password strength, prevents reusing previous password, and revokes sessions.
    """
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="New password and confirm password do not match.")

    token_h = hash_token(req.reset_token.strip())
    now_iso = datetime.datetime.utcnow().isoformat()

    conn = get_db()
    with conn:
        cur = conn.execute("""
            SELECT * FROM password_reset_tokens
            WHERE token_hash = ? AND used_at IS NULL
        """, (token_h,))
        token_record = cur.fetchone()

    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or already used password reset token.")

    if token_record["expires_at"] < now_iso:
        with conn:
            conn.execute("UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token_hash = ?", (token_h,))
        raise HTTPException(status_code=400, detail="Password reset authorization has expired. Please verify again.")

    user_id = token_record["user_id"]
    with conn:
        cur = conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        user = cur.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    uname = user["username"] or user["display_name"] or "learner"
    email = user["email"]

    # Validate password policy & substring checks
    validate_password_policy(req.new_password, uname, email)

    # Password history: cannot reuse current password
    if verify_password(req.new_password, user["password_hash"], user["salt"]):
        raise HTTPException(
            status_code=400,
            detail="New password cannot be the same as your previous password. Please choose a different password."
        )

    # Hash new password with bcrypt
    new_hash = hash_password_bcrypt(req.new_password)

    with conn:
        # Invalidate the reset token
        conn.execute("UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token_hash = ?", (token_h,))

        # Update user password, clear failed attempts & lockouts
        conn.execute("""
            UPDATE users
            SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        """, (new_hash, user_id))

        # Invalidate all active sessions for security
        conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))

    return GenericResponse(
        message="Your password has been successfully reset. Please log in with your new password."
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    ailu_session: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
):
    """Return sanitized profile of currently authenticated user."""
    conn = get_db()
    user = resolve_session_user(conn, cookie_session=ailu_session, bearer_header=authorization)

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")

    uname = user["username"] or user["display_name"] or user["email"].split("@")[0]
    fname = user["full_name"] or user["display_name"] or uname

    return UserResponse(
        userId=user["user_id"],
        username=uname,
        email=user["email"],
        fullName=fname,
        displayName=user["display_name"] or fname,
        isGuest=False,
    )


@router.post("/logout", response_model=GenericResponse)
async def logout(
    response: Response,
    ailu_session: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
):
    """Invalidate session and remove authentication cookie."""
    token = (
        authorization[7:].strip()
        if (authorization and authorization.startswith("Bearer "))
        else ailu_session
    )

    if token:
        conn = get_db()
        with conn:
            conn.execute("DELETE FROM sessions WHERE session_id = ?", (token,))

    clear_session_cookie(response)
    return GenericResponse(message="Successfully logged out.")
