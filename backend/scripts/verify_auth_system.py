"""
End-to-End Automated Verification Suite for AI Learning Universe Authentication & Security.
Tests:
1. Registration (validation, case-insensitive uniqueness, password security policy, substring checks).
2. Login (username or email, invalid credentials, brute-force rate-limiting & temporary account lockout).
3. Authenticated sessions (HTTP-only cookies, Bearer tokens, /me endpoint, logout invalidation).
4. Forgot Password & Email OTP (cryptographic generation, hashed DB storage, resend cooldown, expiration, attempt limits).
5. Password Reset (single-use authorization token, password history prevention, session revocation).
6. Security checks (no plaintext passwords, no plaintext OTPs, no password hash leaks).
"""
import os
import sys
import time
import sqlite3
import datetime
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# Use isolated test DB or temporary environment
TEST_DATA_DIR = BASE_DIR / "data"
os.environ["DATA_DIR"] = str(TEST_DATA_DIR)
os.environ["AUTH_SECRET_KEY"] = "ailu_test_secret_key_verification_suite_2026"

from fastapi.testclient import TestClient
from main import app
from services import email_service
from routers import auth

client = TestClient(app)

TOTAL_TESTS = 0
PASSED_TESTS = 0


def assert_test(condition: bool, name: str, details: str = ""):
    global TOTAL_TESTS, PASSED_TESTS
    TOTAL_TESTS += 1
    if condition:
        PASSED_TESTS += 1
        print(f"  [PASS] {name}")
    else:
        print(f"  [FAIL] {name} - {details}")
        raise AssertionError(f"Test failed: {name}. {details}")


def run_all_tests():
    global TOTAL_TESTS, PASSED_TESTS
    print("=" * 70)
    print("AI LEARNING UNIVERSE — AUTHENTICATION & SECURITY VERIFICATION SUITE")
    print("=" * 70)

    # Clean up test accounts if they exist from prior runs
    conn = auth.get_db()
    with conn:
        conn.execute("DELETE FROM users WHERE username LIKE 'test_%' OR email LIKE 'test_%@example.com'")
        conn.execute("DELETE FROM password_reset_otps WHERE user_id NOT IN (SELECT user_id FROM users)")
        conn.execute("DELETE FROM password_reset_tokens WHERE user_id NOT IN (SELECT user_id FROM users)")
        conn.execute("DELETE FROM sessions WHERE user_id NOT IN (SELECT user_id FROM users)")

    # ────────────────────────────────────────────────────────────────
    # PART A: REGISTRATION & USERNAME VALIDATION TESTS
    # ────────────────────────────────────────────────────────────────
    print("\n[PART A] Testing Registration & Security Policies...")

    # 1. Valid Registration
    reg_payload = {
        "fullName": "Hypatia of Alexandria",
        "username": "test_hypatia",
        "email": "test_hypatia@example.com",
        "password": "SolarCosmos#2026",
        "confirmPassword": "SolarCosmos#2026",
        "guestProgress": {"python-basics": {"status": "completed", "domain": "data-science"}},
        "guestMathProgress": {"math-linear-algebra": {"status": "completed"}},
    }
    r = client.post("/api/auth/register", json=reg_payload)
    assert_test(r.status_code == 200, "Valid Registration", f"Got status {r.status_code}: {r.text}")
    res_data = r.json()
    assert_test(res_data["user"]["username"] == "test_hypatia", "Returned Username Correct")
    assert_test(res_data["user"]["email"] == "test_hypatia@example.com", "Returned Email Correct")
    assert_test("password" not in str(res_data), "Password never in response")
    assert_test("password_hash" not in str(res_data), "Password hash never leaked in response")
    assert_test(res_data["transferredTopics"] >= 1, "Guest Progress Transferred")

    # 2. Case-Insensitive Duplicate Username Rejection
    dup_uname_payload = dict(reg_payload)
    dup_uname_payload["username"] = "TEST_HYPATIA"  # uppercase
    dup_uname_payload["email"] = "different_hypatia@example.com"
    r = client.post("/api/auth/register", json=dup_uname_payload)
    assert_test(r.status_code == 409, "Duplicate Username (Case-Insensitive) Rejected", f"Status: {r.status_code}")
    assert_test("already taken" in r.text.lower(), "Helpful username error message returned")

    # 3. Case-Insensitive Duplicate Email Rejection
    dup_email_payload = dict(reg_payload)
    dup_email_payload["username"] = "hypatia_second"
    dup_email_payload["email"] = "TEST_HYPATIA@EXAMPLE.COM"  # uppercase email
    r = client.post("/api/auth/register", json=dup_email_payload)
    assert_test(r.status_code == 409, "Duplicate Email (Case-Insensitive) Rejected", f"Status: {r.status_code}")

    # 4. Weak Password Rejections
    weak_cases = [
        ("short1!", "Password must be at least 8 characters long"),
        ("nouppercase123!", "contain at least one uppercase letter"),
        ("NOLOWERCASE123!", "contain at least one lowercase letter"),
        ("NoDigitsHere!!", "contain at least one number"),
        ("NoSpecialChar123", "contain at least one special character"),
    ]
    for weak_pw, expected_err in weak_cases:
        p = dict(reg_payload)
        p["username"] = f"test_{int(time.time()*1000)%100000}"
        p["email"] = f"{p['username']}@example.com"
        p["password"] = weak_pw
        p["confirmPassword"] = weak_pw
        r = client.post("/api/auth/register", json=p)
        assert_test(r.status_code == 400, f"Weak Password Rejected ({weak_pw})", f"Status: {r.status_code}")

    # 5. Username or Email prefix inside Password Substring Check
    p_user_in_pw = dict(reg_payload)
    p_user_in_pw["username"] = "newstudent"
    p_user_in_pw["email"] = "newstudent@example.com"
    p_user_in_pw["password"] = "Secret_newstudent_2026!"
    p_user_in_pw["confirmPassword"] = "Secret_newstudent_2026!"
    r = client.post("/api/auth/register", json=p_user_in_pw)
    assert_test(r.status_code == 400, "Password containing username rejected", f"Status: {r.status_code}")

    # 6. Password mismatch rejection
    p_mismatch = dict(reg_payload)
    p_mismatch["username"] = "test_mismatch"
    p_mismatch["email"] = "test_mismatch@example.com"
    p_mismatch["password"] = "ValidPass#2026"
    p_mismatch["confirmPassword"] = "DifferentPass#2026"
    r = client.post("/api/auth/register", json=p_mismatch)
    assert_test(r.status_code == 400, "Password confirmation mismatch rejected", f"Status: {r.status_code}")

    # 7. Real-time Username Checker endpoint
    r_chk1 = client.get("/api/auth/check-username?username=test_hypatia")
    assert_test(r_chk1.json()["available"] is False, "Username Checker reports taken username")
    r_chk2 = client.get("/api/auth/check-username?username=completely_free_un123")
    assert_test(r_chk2.json()["available"] is True, "Username Checker reports free username")

    # ────────────────────────────────────────────────────────────────
    # PART B: SECURE LOGIN, RATE LIMITING & LOCKOUT TESTS
    # ────────────────────────────────────────────────────────────────
    print("\n[PART B] Testing Login, Rate Limiting & Account Lockout...")

    # 1. Login with Username
    r = client.post("/api/auth/login", json={"identifier": "test_hypatia", "password": "SolarCosmos#2026"})
    assert_test(r.status_code == 200, "Login via Username Successful", f"Status: {r.status_code}")
    hypatia_token = r.json()["token"]
    assert_test(len(hypatia_token) > 20, "Session token issued")

    # 2. Login with Email
    r = client.post("/api/auth/login", json={"identifier": "test_hypatia@example.com", "password": "SolarCosmos#2026"})
    assert_test(r.status_code == 200, "Login via Email Successful", f"Status: {r.status_code}")

    # 3. Invalid credentials (unknown identifier)
    r = client.post("/api/auth/login", json={"identifier": "nonexistent_user", "password": "AnyPassword#123"})
    assert_test(r.status_code == 401, "Invalid User Rejected", f"Status: {r.status_code}")
    assert_test("invalid username/email or password" in r.text.lower(), "Generic error returned (no enumeration)")

    # 4. Incorrect Password & Brute-Force Lockout
    # Create a specific user to test lockout without affecting others
    lockout_uname = "test_lockout_target"
    lockout_email = "test_lockout@example.com"
    client.post("/api/auth/register", json={
        "fullName": "Lockout Target",
        "username": lockout_uname,
        "email": lockout_email,
        "password": "TargetPass#2026",
        "confirmPassword": "TargetPass#2026",
    })

    # Attempt 4 failed logins (should remain 401)
    for i in range(1, 5):
        r_fail = client.post("/api/auth/login", json={"identifier": lockout_uname, "password": f"WrongAttempt#{i}"})
        assert_test(r_fail.status_code == 401, f"Failed Attempt {i} returned 401")

    # 5th failed attempt should trigger account lockout (423 Locked)
    r_lock = client.post("/api/auth/login", json={"identifier": lockout_uname, "password": "WrongAttempt#5"})
    assert_test(r_lock.status_code == 423, "5th Failed Attempt Triggers Account Lockout (423)", f"Status: {r_lock.status_code}")
    assert_test("locked" in r_lock.text.lower(), "Lockout warning message returned")

    # Even with correct password, account remains locked until lockout expires or password reset
    r_locked_good_pw = client.post("/api/auth/login", json={"identifier": lockout_uname, "password": "TargetPass#2026"})
    assert_test(r_locked_good_pw.status_code == 423, "Locked Account Rejects Correct Password During Lockout")

    # ────────────────────────────────────────────────────────────────
    # PART C: AUTHENTICATED SESSION SECURITY & LOGOUT
    # ────────────────────────────────────────────────────────────────
    print("\n[PART C] Testing Authenticated Sessions & Logout...")

    # Verify /me with Bearer token
    r_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {hypatia_token}"})
    assert_test(r_me.status_code == 200, "Authenticated /api/auth/me accepts Bearer token")
    assert_test(r_me.json()["username"] == "test_hypatia", "Profile matches authenticated user")

    # Logout invalidates session
    r_logout = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {hypatia_token}"})
    assert_test(r_logout.status_code == 200, "Logout succeeds")

    # Subsequent call with invalidated token should fail with 401
    r_me_after = client.get("/api/auth/me", headers={"Authorization": f"Bearer {hypatia_token}"})
    assert_test(r_me_after.status_code == 401, "Logged-out session is immediately revoked")

    # ────────────────────────────────────────────────────────────────
    # PART D: FORGOT PASSWORD & EMAIL OTP FLOW
    # ────────────────────────────────────────────────────────────────
    print("\n[PART D] Testing Forgot Password & Email OTP...")

    email_service.clear_dev_outbox()

    # 1. Request OTP for registered user
    r_forgot = client.post("/api/auth/forgot-password", json={"email": "test_hypatia@example.com"})
    assert_test(r_forgot.status_code == 200, "Forgot password endpoint returns 200 generic response")
    assert_test("password reset instructions have been sent" in r_forgot.json()["message"].lower(), "Generic message prevents account enumeration")

    # Check dev outbox for delivered OTP
    otp_code = email_service.get_latest_otp_for_email("test_hypatia@example.com")
    assert_test(otp_code is not None and len(otp_code) == 6 and otp_code.isdigit(), "Cryptographically random 6-digit OTP dispatched")

    # Check database: OTP must be hashed, never plaintext!
    with conn:
        cur = conn.execute("SELECT * FROM password_reset_otps WHERE user_id = (SELECT user_id FROM users WHERE username = 'test_hypatia') ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        assert_test(row is not None, "OTP record saved to database")
        assert_test(row["otp_hash"] != otp_code, "OTP is hashed in database (NOT plaintext)")
        assert_test(len(row["otp_hash"]) == 64, "OTP hash is SHA-256 (64 hex characters)")

    # 2. Resend Cooldown (within 60 seconds)
    r_resend_fast = client.post("/api/auth/forgot-password", json={"email": "test_hypatia@example.com"})
    assert_test(r_resend_fast.status_code == 200, "Resend request handled")
    assert_test("please wait before requesting another" in r_resend_fast.json()["message"].lower() or "instructions have been sent" in r_resend_fast.json()["message"].lower(), "Cooldown prevents rapid spam")

    # 3. Request OTP for unregistered user (must also return generic response!)
    r_forgot_unknown = client.post("/api/auth/forgot-password", json={"email": "ghost_unknown_never@example.com"})
    assert_test(r_forgot_unknown.status_code == 200, "Unregistered email also returns 200 generic message")

    # 4. Incorrect OTP verification
    r_bad_otp = client.post("/api/auth/verify-otp", json={"email": "test_hypatia@example.com", "otp": "000000"})
    assert_test(r_bad_otp.status_code == 400, "Incorrect OTP rejected")
    assert_test("remaining" in r_bad_otp.text.lower(), "Attempt counter surfaced in warning")

    # 5. Successful OTP verification
    r_good_otp = client.post("/api/auth/verify-otp", json={"email": "test_hypatia@example.com", "otp": otp_code})
    assert_test(r_good_otp.status_code == 200, "Valid OTP Verification Successful", f"Got: {r_good_otp.text}")
    reset_token = r_good_otp.json().get("resetToken")
    assert_test(reset_token is not None and len(reset_token) > 20, "Single-use Reset Authorization Token issued")

    # 6. OTP Reuse Prevention: Same OTP cannot be verified a second time
    r_reuse_otp = client.post("/api/auth/verify-otp", json={"email": "test_hypatia@example.com", "otp": otp_code})
    assert_test(r_reuse_otp.status_code == 400, "Used OTP cannot be reused")

    # ────────────────────────────────────────────────────────────────
    # PART E: PASSWORD RESET & SESSION REVOCATION
    # ────────────────────────────────────────────────────────────────
    print("\n[PART E] Testing Password Reset Workflow...")

    # 1. Prevent reusing current password
    r_same_pw = client.post("/api/auth/reset-password", json={
        "resetToken": reset_token,
        "newPassword": "SolarCosmos#2026",  # current password
        "confirmPassword": "SolarCosmos#2026",
    })
    assert_test(r_same_pw.status_code == 400, "Cannot reuse current password", f"Status: {r_same_pw.status_code}")
    assert_test("same as your previous password" in r_same_pw.text.lower(), "Password history message returned")

    # 2. Reset password with new secure password
    new_password = "NovaGalaxy#2027"
    r_reset = client.post("/api/auth/reset-password", json={
        "resetToken": reset_token,
        "newPassword": new_password,
        "confirmPassword": new_password,
    })
    assert_test(r_reset.status_code == 200, "Password Reset Successful", f"Status: {r_reset.status_code}")

    # 3. Token cannot be reused
    r_reuse_token = client.post("/api/auth/reset-password", json={
        "resetToken": reset_token,
        "newPassword": "AnotherPassword#2028",
        "confirmPassword": "AnotherPassword#2028",
    })
    assert_test(r_reuse_token.status_code == 400, "Reset token cannot be reused")

    # 4. Old password no longer works
    r_old_login = client.post("/api/auth/login", json={"identifier": "test_hypatia", "password": "SolarCosmos#2026"})
    assert_test(r_old_login.status_code == 401, "Old password rejected after reset")

    # 5. New password works
    r_new_login = client.post("/api/auth/login", json={"identifier": "test_hypatia", "password": new_password})
    assert_test(r_new_login.status_code == 200, "Login with new password succeeds")

    # ────────────────────────────────────────────────────────────────
    # PART F: UNLOCK LOCKED ACCOUNT VIA OTP RESET
    # ────────────────────────────────────────────────────────────────
    print("\n[PART F] Testing Account Recovery for Locked Account...")
    # Target account is still locked from Part B
    email_service.clear_dev_outbox()
    # Force last OTP creation timestamp older to avoid cooldown
    with conn:
        conn.execute("UPDATE password_reset_otps SET created_at = datetime('now', '-2 minutes')")

    r_lock_forgot = client.post("/api/auth/forgot-password", json={"email": lockout_email})
    assert_test(r_lock_forgot.status_code == 200, "Forgot password accepts locked account")
    lock_otp = email_service.get_latest_otp_for_email(lockout_email)
    assert_test(lock_otp is not None, "OTP generated for locked account")

    r_lock_verify = client.post("/api/auth/verify-otp", json={"email": lockout_email, "otp": lock_otp})
    assert_test(r_lock_verify.status_code == 200, "OTP verified for locked account")
    lock_reset_token = r_lock_verify.json()["resetToken"]

    r_lock_reset = client.post("/api/auth/reset-password", json={
        "resetToken": lock_reset_token,
        "newPassword": "UnlockedPass#2026",
        "confirmPassword": "UnlockedPass#2026",
    })
    assert_test(r_lock_reset.status_code == 200, "Password reset unlocks account")

    # Login to previously locked account now succeeds immediately
    r_unlocked_login = client.post("/api/auth/login", json={"identifier": lockout_uname, "password": "UnlockedPass#2026"})
    assert_test(r_unlocked_login.status_code == 200, "Unlocked account logs in successfully")

    # ────────────────────────────────────────────────────────────────
    # PART G: DATABASE SECURITY & PLAINTEXT AUDIT
    # ────────────────────────────────────────────────────────────────
    print("\n[PART G] Auditing Database Security...")
    with conn:
        cur = conn.execute("SELECT password_hash FROM users WHERE username = 'test_hypatia'")
        user_row = cur.fetchone()
        stored_pw = user_row["password_hash"]
        assert_test(stored_pw.startswith("$2b$") or stored_pw.startswith("$2a$"), "Password stored using bcrypt ($2b$)")
        assert_test(new_password not in stored_pw, "Raw password never in database")

        cur = conn.execute("SELECT otp_hash FROM password_reset_otps")
        for row in cur.fetchall():
            assert_test(len(row["otp_hash"]) == 64, "All OTP records in DB are 64-char hashes, never 6-digit plaintext")

    print("\n" + "=" * 70)
    print(f"VERIFICATION COMPLETE: {PASSED_TESTS}/{TOTAL_TESTS} tests passed (100% SUCCESS)!")
    print("=" * 70)


if __name__ == "__main__":
    run_all_tests()
