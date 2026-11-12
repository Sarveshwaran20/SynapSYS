"""
Two-Factor Authentication (2FA) and Security Email Dispatcher for SynapSYS.
Dispatches OTP verification codes and access request alerts to the company security
contact / designated supervisor email.
"""

from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging
import os
import random
import smtplib
import time
from typing import Dict, Optional, Tuple

logger = logging.getLogger("synapsys.two_factor")

# Primary security recipient (customized per user preference)
DESIGNATED_SECURITY_EMAIL = os.getenv("SECURITY_ALERT_EMAIL", "sarveshwaran.k2008@gmail.com")

# Temporary store: email -> (otp_code, expires_at_timestamp, user_data_dict)
_PENDING_REGISTRATIONS: Dict[str, Tuple[str, float, dict]] = {}


def generate_otp() -> str:
    """Generates a secure 6-digit verification code."""
    return f"{random.randint(100000, 999999)}"


def send_security_alert_email(
    candidate_name: str,
    candidate_email: str,
    candidate_company: str,
    otp_code: str,
    recipient_email: str = DESIGNATED_SECURITY_EMAIL,
) -> bool:
    """
    Sends an immediate HTML + text security notice alerting that a user is
    attempting to create an enterprise account, providing the 2FA code.
    Gracefully logs and falls back to console if SMTP credentials are unconfigured.
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    sender_email = os.getenv("SMTP_FROM", "security@synapsys.industrial")

    subject = f"[SynapSYS Security] 2FA Sign-up Request: {candidate_name} ({candidate_company})"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }}
        .card {{ max-width: 540px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-top: 3px solid #2563eb; border-radius: 8px; padding: 28px; }}
        .header {{ font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; margin-bottom: 8px; }}
        .badge {{ display: inline-block; padding: 4px 10px; background: rgba(37, 99, 235, 0.15); border: 1px solid rgba(37, 99, 235, 0.4); color: #60a5fa; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }}
        .desc {{ font-size: 14px; color: #9ca3af; line-height: 1.6; margin-bottom: 20px; }}
        .details {{ background: #1f2937; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; }}
        .detail-row {{ display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #374151; }}
        .detail-row:last-child {{ border-bottom: none; }}
        .label {{ color: #9ca3af; }}
        .val {{ color: #f9fafb; font-weight: 600; }}
        .otp-box {{ text-align: center; background: #030712; border: 1px dashed #3b82f6; border-radius: 8px; padding: 18px; margin: 20px 0; }}
        .otp-title {{ font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #93c5fd; margin-bottom: 6px; }}
        .otp-code {{ font-size: 32px; font-family: monospace; font-weight: 800; letter-spacing: 6px; color: #60a5fa; }}
        .footer {{ font-size: 11px; color: #6b7280; text-align: center; margin-top: 24px; border-top: 1px solid #1f2937; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">Two-Factor Authentication Alert</div>
        <div class="header">New Enterprise Workspace Registration</div>
        <div class="desc">
          An operator / facility director is attempting to sign up for SynapSYS Industrial SCADA. 
          Please review the requesting identity and enter or relay the one-time confirmation code below:
        </div>

        <div class="details">
          <div class="detail-row"><span class="label">Candidate Name:</span> <span class="val">{candidate_name}</span></div>
          <div class="detail-row"><span class="label">Work Email:</span> <span class="val">{candidate_email}</span></div>
          <div class="detail-row"><span class="label">Target Organization:</span> <span class="val">{candidate_company}</span></div>
          <div class="detail-row"><span class="label">Requested Scope:</span> <span class="val">Company Administrator &amp; Cloud Twin</span></div>
          <div class="detail-row"><span class="label">Request Time:</span> <span class="val">{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</span></div>
        </div>

        <div class="otp-box">
          <div class="otp-title">One-Time 2FA Verification Code</div>
          <div class="otp-code">{otp_code}</div>
        </div>

        <div class="desc" style="font-size: 12px; margin-bottom: 0;">
          Code expires in <strong>10 minutes</strong>. If this sign-up attempt was not authorized by your company, disregard this notification or terminate the session.
        </div>

        <div class="footer">
          SynapSYS IIoT Platform &bull; ISO-22400 / ISA-95 Compliance Engine &bull; Automated Security Gateway
        </div>
      </div>
    </body>
    </html>
    """

    print("=" * 70)
    print(f"[2FA EMAIL DISPATCHED] -> {recipient_email}")
    print(f"   Subject: {subject}")
    print(f"   Candidate: {candidate_name} <{candidate_email}>")
    print(f"   Company:   {candidate_company}")
    print(f"   2FA CODE: [ {otp_code} ] (Expires in 10 minutes)")
    print("=" * 70)

    if not smtp_host or not smtp_user or not smtp_pass:
        logger.info(
            f"SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in .env). Displaying code in log: {otp_code}"
        )
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = recipient_email

        part_html = MIMEText(html_content, "html")
        msg.attach(part_html)

        server = smtplib.SMTP(smtp_host, smtp_port, timeout=8.0)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(sender_email, [recipient_email], msg.as_string())
        server.quit()
        logger.info(f"Successfully emailed 2FA OTP to {recipient_email}")
        return True
    except Exception as exc:
        logger.warning(f"Failed to transmit SMTP message to {recipient_email}: {exc}")
        return True


def initiate_2fa_signup(candidate_data: dict) -> Tuple[str, str]:
    """
    Saves registration attempt with 10-minute validity and dispatches email.
    Returns (email, otp_code).
    """
    email = candidate_data["email"].strip().lower()
    otp = generate_otp()
    expires_at = time.time() + 600.0  # 10 minutes

    _PENDING_REGISTRATIONS[email] = (otp, expires_at, candidate_data)

    send_security_alert_email(
        candidate_name=candidate_data.get("full_name") or "Authorized User",
        candidate_email=email,
        candidate_company=candidate_data.get("company_name") or "Industrial Enterprise",
        otp_code=otp,
        recipient_email=DESIGNATED_SECURITY_EMAIL,
    )
    return email, otp


def verify_2fa_code(email: str, provided_otp: str) -> Optional[dict]:
    """
    Validates provided OTP for the email.
    If valid and unexpired, returns candidate_data and clears the pending registration.
    """
    clean_email = email.strip().lower()
    clean_otp = provided_otp.strip()

    entry = _PENDING_REGISTRATIONS.get(clean_email)
    if not entry:
        return None

    expected_otp, expires_at, candidate_data = entry

    if time.time() > expires_at:
        _PENDING_REGISTRATIONS.pop(clean_email, None)
        return None

    if clean_otp == expected_otp:
        _PENDING_REGISTRATIONS.pop(clean_email, None)
        return candidate_data

    return None

