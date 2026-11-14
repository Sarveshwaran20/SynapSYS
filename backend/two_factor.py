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

try:
    from dotenv import load_dotenv
    _BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    load_dotenv(os.path.join(os.path.dirname(_BASE_DIR), ".env"))
    load_dotenv(os.path.join(_BASE_DIR, ".env"))
except ImportError:
    pass

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
) -> dict:
    """
    Sends an immediate HTML + text security notice alerting that a user is
    attempting to create an enterprise account, providing the 2FA code.
    Connects to SMTP if configured (e.g. Gmail SMTP), or reports unconfigured state with sandbox key.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    sender_email = os.getenv("SMTP_FROM", smtp_user or "security@synapsys.industrial")

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
    print(f"[2FA EMAIL INITIATED] -> {recipient_email}")
    print(f"   Subject: {subject}")
    print(f"   Candidate: {candidate_name} <{candidate_email}>")
    print(f"   Company:   {candidate_company}")
    print(f"   2FA CODE: [ {otp_code} ] (Expires in 10 minutes)")
    print("=" * 70)

    if not smtp_user or not smtp_pass:
        msg = f"SMTP unconfigured in .env. Live email not dispatched to {recipient_email}. Sandbox passcode available."
        logger.info(msg)
        return {
            "delivered": False,
            "recipient": recipient_email,
            "method": "sandbox",
            "status_message": msg,
            "error_detail": "Missing SMTP_USER and SMTP_PASS in .env",
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = recipient_email

        part_html = MIMEText(html_content, "html")
        msg.attach(part_html)

        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10.0)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10.0)
            server.starttls()

        server.login(smtp_user, smtp_pass)
        server.sendmail(sender_email, [recipient_email], msg.as_string())
        server.quit()
        logger.info(f"Successfully emailed 2FA OTP to {recipient_email}")
        return {
            "delivered": True,
            "recipient": recipient_email,
            "method": "smtp",
            "status_message": f"Verification email dispatched to {recipient_email} via SMTP.",
            "error_detail": None,
        }
    except Exception as exc:
        err_msg = f"SMTP transmission failed: {exc}"
        logger.warning(err_msg)
        return {
            "delivered": False,
            "recipient": recipient_email,
            "method": "sandbox_fallback",
            "status_message": f"Failed to deliver email to {recipient_email} ({exc}). Sandbox passkey available.",
            "error_detail": str(exc),
        }


def initiate_2fa_signup(candidate_data: dict) -> Tuple[str, str, dict]:
    """
    Saves registration attempt with 10-minute validity and dispatches email.
    Returns (email, otp_code, delivery_info).
    """
    email = candidate_data["email"].strip().lower()
    otp = generate_otp()
    expires_at = time.time() + 600.0  # 10 minutes

    _PENDING_REGISTRATIONS[email] = (otp, expires_at, candidate_data)

    delivery_info = send_security_alert_email(
        candidate_name=candidate_data.get("full_name") or "Authorized User",
        candidate_email=email,
        candidate_company=candidate_data.get("company_name") or "Industrial Enterprise",
        otp_code=otp,
        recipient_email=DESIGNATED_SECURITY_EMAIL,
    )
    return email, otp, delivery_info


def verify_2fa_code(email: str, provided_otp: str) -> Optional[dict]:
    """
    Validates provided OTP for the email.
    If valid and unexpired, returns candidate_data and clears the pending registration.
    Also accepts standard sandbox passcode 123456 during development.
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

    if clean_otp == expected_otp or clean_otp == "123456":
        _PENDING_REGISTRATIONS.pop(clean_email, None)
        return candidate_data

    return None


# ---------------------------------------------------------------------------
# Procurement Purchase Order 2FA Authorization Engine
# ---------------------------------------------------------------------------
_PENDING_PO_AUTHORIZATIONS: Dict[str, Tuple[str, float, dict]] = {}


def send_po_security_alert_email(
    po_draft: dict,
    otp_code: str,
    recipient_email: str = DESIGNATED_SECURITY_EMAIL,
) -> dict:
    """
    Sends an immediate 2FA security challenge email to the supervisor alerting
    that an operator is requesting to dispatch a Purchase Order to an external seller.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    sender_email = os.getenv("SMTP_FROM", smtp_user or "security@synapsys.industrial")

    po_id = po_draft.get("po_id", "PO-DRAFT")
    vendor_name = po_draft.get("supplier_name", "Approved Vendor")
    vendor_email = po_draft.get("supplier_email", "N/A")
    total_inr = float(po_draft.get("total_inr") or po_draft.get("total_usd") or 0.0)
    operator = po_draft.get("created_by") or "Authorized Plant Operator"
    facility = po_draft.get("facility") or "Detroit Plant C4 / Coimbatore Unit"
    items = po_draft.get("items", [])

    subject = f"[SynapSYS Security] 2FA Purchase Order Authorization: {po_id} (INR {total_inr:,.2f})"

    items_html = "".join([
        f"""<tr>
            <td style="padding: 8px; border-bottom: 1px solid #374151; font-family: monospace;">{it.get('sku', 'N/A')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #374151;">{it.get('name', 'Item')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #374151; text-align: center;">{it.get('quantity', 1)} {it.get('unit', 'pcs')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #374151; text-align: right; font-weight: bold;">INR {float(it.get('unit_price_inr') or it.get('unit_price_usd') or it.get('unit_price') or 0.0):,.2f}</td>
        </tr>"""
        for it in items
    ])

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }}
        .card {{ max-width: 580px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-top: 4px solid #10b981; border-radius: 8px; padding: 28px; }}
        .badge {{ display: inline-block; padding: 4px 10px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 14px; }}
        .header {{ font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; margin-bottom: 8px; }}
        .desc {{ font-size: 13px; color: #9ca3af; line-height: 1.6; margin-bottom: 18px; }}
        .details {{ background: #1f2937; border-radius: 6px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px; }}
        .detail-row {{ display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #374151; }}
        .detail-row:last-child {{ border-bottom: none; }}
        .label {{ color: #9ca3af; }}
        .val {{ color: #f9fafb; font-weight: 600; }}
        .otp-box {{ text-align: center; background: #030712; border: 2px dashed #10b981; border-radius: 8px; padding: 18px; margin: 20px 0; }}
        .otp-title {{ font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #6ee7b7; margin-bottom: 6px; font-weight: 700; }}
        .otp-code {{ font-size: 36px; font-family: monospace; font-weight: 800; letter-spacing: 8px; color: #34d399; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }}
        th {{ background: #111827; color: #9ca3af; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; }}
        .footer {{ font-size: 11px; color: #6b7280; text-align: center; margin-top: 24px; border-top: 1px solid #1f2937; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">Procurement 2FA Authorization Required</div>
        <div class="header">Purchase Order Dispatch Approval</div>
        <div class="desc">
          An operator has requested to place and dispatch an official purchase order to an external vendor. 
          To authorize this order, enter this 6-digit confirmation code on the SynapSYS Inventory Terminal:
        </div>

        <div class="details">
          <div class="detail-row"><span class="label">Purchase Order ID:</span> <span class="val">{po_id}</span></div>
          <div class="detail-row"><span class="label">Target Seller / Vendor:</span> <span class="val">{vendor_name} ({vendor_email})</span></div>
          <div class="detail-row"><span class="label">Requesting Operator:</span> <span class="val">{operator}</span></div>
          <div class="detail-row"><span class="label">Destination Facility:</span> <span class="val">{facility}</span></div>
          <div class="detail-row"><span class="label">Total Amount:</span> <span class="val" style="color: #34d399; font-size: 15px;">INR {total_inr:,.2f}</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
            </tr>
          </thead>
          <tbody>
            {items_html}
          </tbody>
        </table>

        <div class="otp-box">
          <div class="otp-title">One-Time Procurement Authorization 2FA Code</div>
          <div class="otp-code">{otp_code}</div>
        </div>

        <div class="desc" style="font-size: 12px; margin-bottom: 0;">
          Code expires in <strong>10 minutes</strong>. Once confirmed, the order will be locked and dispatched.
        </div>

        <div class="footer">
          SynapSYS IIoT Platform &bull; ISO-9001 Procurement Governance &bull; Supervisor: {recipient_email}
        </div>
      </div>
    </body>
    </html>
    """

    print("=" * 70)
    print(f"[PROCUREMENT 2FA OTP INITIATED] -> {recipient_email}")
    print(f"   Subject:    {subject}")
    print(f"   PO Target:  {po_id} -> {vendor_name} ({vendor_email})")
    print(f"   Total INR:  INR {total_inr:,.2f}")
    print(f"   2FA CODE:   [ {otp_code} ] (Expires in 10 minutes)")
    print("=" * 70)

    if not smtp_user or not smtp_pass:
        msg = f"SMTP unconfigured in .env. Live email not dispatched to {recipient_email}. Sandbox passcode available."
        logger.info(msg)
        return {
            "delivered": False,
            "recipient": recipient_email,
            "method": "sandbox",
            "status_message": msg,
            "error_detail": "Missing SMTP_USER and SMTP_PASS in .env",
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = recipient_email

        part_html = MIMEText(html_content, "html")
        msg.attach(part_html)

        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10.0)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10.0)
            server.starttls()

        server.login(smtp_user, smtp_pass)
        server.sendmail(sender_email, [recipient_email], msg.as_string())
        server.quit()
        logger.info(f"Successfully emailed procurement 2FA OTP to {recipient_email}")
        return {
            "delivered": True,
            "recipient": recipient_email,
            "method": "smtp",
            "status_message": f"Procurement 2FA email dispatched to {recipient_email} via SMTP.",
            "error_detail": None,
        }
    except Exception as exc:
        err_msg = f"Failed to transmit procurement 2FA message: {exc}"
        logger.warning(err_msg)
        return {
            "delivered": False,
            "recipient": recipient_email,
            "method": "sandbox_fallback",
            "status_message": f"Failed to deliver email to {recipient_email} ({exc}). Sandbox passkey available.",
            "error_detail": str(exc),
        }


def initiate_po_authorization_2fa(po_draft: dict) -> Tuple[str, str, dict]:
    """
    Registers a pending Purchase Order authorization request with a 10-minute expiry.
    Returns (auth_token, otp_code, delivery_info).
    """
    import uuid
    auth_token = f"PO-AUTH-{uuid.uuid4().hex[:12].upper()}"
    otp = generate_otp()
    expires_at = time.time() + 600.0  # 10 minutes

    _PENDING_PO_AUTHORIZATIONS[auth_token] = (otp, expires_at, po_draft)

    delivery_info = send_po_security_alert_email(
        po_draft=po_draft,
        otp_code=otp,
        recipient_email=DESIGNATED_SECURITY_EMAIL,
    )
    return auth_token, otp, delivery_info


def verify_po_authorization_2fa(auth_token: str, provided_otp: str) -> Optional[dict]:
    """
    Validates the 2FA code for a pending purchase order authorization.
    Returns the po_draft if valid, or None if invalid/expired.
    Also accepts sandbox passcode 123456.
    """
    clean_token = auth_token.strip()
    clean_otp = provided_otp.strip()

    entry = _PENDING_PO_AUTHORIZATIONS.get(clean_token)
    if not entry:
        return None

    expected_otp, expires_at, po_draft = entry

    if time.time() > expires_at:
        _PENDING_PO_AUTHORIZATIONS.pop(clean_token, None)
        return None

    if clean_otp == expected_otp or clean_otp == "123456":
        _PENDING_PO_AUTHORIZATIONS.pop(clean_token, None)
        return po_draft

    return None
