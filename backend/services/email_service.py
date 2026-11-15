"""
Email Service for AI Learning Universe.
Supports free SMTP email delivery (e.g., Gmail SMTP with App Password, custom SMTP)
with graceful development fallback and test delivery outbox.
"""
from __future__ import annotations

import collections
import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, List, Optional

logger = logging.getLogger("ailu.email")

# In-memory test outbox for automated testing without requiring real external SMTP
_DEV_EMAIL_OUTBOX: collections.deque[Dict[str, str]] = collections.deque(maxlen=50)


def get_latest_otp_for_email(email: str) -> Optional[str]:
    """Helper for automated tests to retrieve the most recent OTP dispatched in dev/test mode."""
    norm = email.strip().lower()
    for item in reversed(_DEV_EMAIL_OUTBOX):
        if item.get("to_email") == norm:
            return item.get("otp")
    return None


def clear_dev_outbox() -> None:
    """Clear test outbox."""
    _DEV_EMAIL_OUTBOX.clear()


def is_smtp_configured() -> bool:
    """Check if SMTP credentials are provided in the environment."""
    host = os.environ.get("SMTP_HOST", "").strip()
    user = os.environ.get("SMTP_USERNAME", "").strip()
    pw = os.environ.get("SMTP_PASSWORD", "").strip()
    return bool(host and user and pw)


def _render_plain_text(full_name: str, otp: str) -> str:
    name_greeting = f"Hello {full_name}," if full_name else "Hello,"
    return (
        f"{name_greeting}\n\n"
        "We received a request to reset your AI Learning Universe account password.\n\n"
        f"Your verification code is:\n\n"
        f"  {otp}\n\n"
        "This code expires in 5 minutes.\n\n"
        "If you did not request this password reset, please ignore this email or review your account security.\n\n"
        "— AI Learning Universe Team\n"
        "https://ai-learning-universe.onrender.com\n"
    )


def _render_html(full_name: str, otp: str) -> str:
    name_greeting = f"Hello {full_name}," if full_name else "Hello,"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Learning Universe — Password Reset OTP</title>
</head>
<body style="margin:0;padding:0;background-color:#050814;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E2E8F0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#050814;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:540px;background-color:#0B1633;border:1px solid #1E293B;border-radius:14px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="padding:28px 32px 20px 32px;background:linear-gradient(135deg, rgba(22,75,255,0.2) 0%, rgba(6,182,212,0.15) 100%);border-bottom:1px solid #1E293B;">
              <div style="font-size:12px;font-weight:700;letter-spacing:1.5px;color:#06B6D4;text-transform:uppercase;margin-bottom:6px;">
                SECURITY VERIFICATION
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">
                AI Learning Universe
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#F1F5F9;">
                {name_greeting}
              </p>
              <p style="margin:0 0 24px 0;font-size:14px;line-height:22px;color:#94A3B8;">
                We received a request to reset the password for your AI Learning Universe account. Use the 6-digit verification code below to authorize your password reset:
              </p>

              <!-- OTP Display Box -->
              <div style="background-color:#050814;border:1px solid #164BFF;border-radius:10px;padding:20px;text-align:center;margin:0 0 24px 0;">
                <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;margin-bottom:8px;">
                  ONE-TIME VERIFICATION CODE
                </div>
                <div style="font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:800;letter-spacing:10px;color:#06B6D4;">
                  {otp}
                </div>
                <div style="font-size:12px;color:#FACC15;margin-top:10px;font-weight:600;">
                  ⏱ Expires in 5 minutes · Single-use only
                </div>
              </div>

              <p style="margin:0 0 16px 0;font-size:13px;line-height:20px;color:#64748B;">
                If you did not request this password reset, no action is needed. Your account remains secure and your current password will not be changed without this verification code.
              </p>

              <div style="border-top:1px solid #1E293B;margin-top:28px;padding-top:20px;font-size:12px;color:#64748B;line-height:18px;">
                Secure automated transmission by <strong>AI Learning Universe</strong>.<br>
                Never share this verification code with anyone.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_password_reset_otp(to_email: str, full_name: str, otp: str) -> bool:
    """
    Sends a 6-digit numeric OTP to the specified user email.
    If SMTP credentials are configured in the environment, delivers via SMTP.
    Otherwise, gracefully stores in dev outbox for local testing.
    """
    to_norm = to_email.strip().lower()

    # Always record into dev outbox for test suites and dev diagnostics
    _DEV_EMAIL_OUTBOX.append({
        "to_email": to_norm,
        "full_name": full_name,
        "otp": otp,
    })

    if not is_smtp_configured():
        logger.info(
            "SMTP not configured in environment. Recorded password reset OTP for %s in dev outbox.",
            to_norm,
        )
        return True

    # Real SMTP Dispatch
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com").strip()
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ.get("SMTP_USERNAME", "").strip()
    pw = os.environ.get("SMTP_PASSWORD", "").strip()
    from_email = os.environ.get("SMTP_FROM_EMAIL", user).strip()
    from_name = os.environ.get("SMTP_FROM_NAME", "AI Learning Universe").strip()

    subject = "AI Learning Universe — Password Reset OTP"
    plain_text = _render_plain_text(full_name, otp)
    html_content = _render_html(full_name, otp)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = to_norm

    msg.attach(MIMEText(plain_text, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=10) as server:
                server.login(user, pw)
                server.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=10) as server:
                server.starttls()
                server.login(user, pw)
                server.send_message(msg)
        logger.info("Successfully dispatched password reset OTP to %s via SMTP.", to_norm)
        return True
    except Exception as exc:
        logger.error("Failed to send OTP email via SMTP to %s: %s", to_norm, exc)
        # Even if SMTP fails on external host, don't crash the server; return False
        return False
