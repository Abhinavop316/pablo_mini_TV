import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)


def build_setup_email_html(
    recipient_email: str,
    setup_url: str,
    expires_days: int = 7,
    user_name: Optional[str] = None,
    username: Optional[str] = None,
    role: str = "Editor",
    temporary_password: Optional[str] = None,
) -> str:
    """Generates a responsive HTML email styled with the PeBlo Studio brand."""
    display_greeting = f"Welcome to the Team, {user_name or username or 'Editor'}! 🎉"
    handle_str = f"@{username}" if username else recipient_email

    temp_pass_block = ""
    if temporary_password:
        temp_pass_block = f"""
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4effc; border-radius: 12px; border: 1.5px solid #543488; margin-bottom: 24px;">
          <tr>
            <td style="padding: 16px 20px;">
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #543488;">🔑 Your Temporary Credentials:</p>
              <p style="margin: 0; font-size: 14px; color: #2d184c;">Username: <strong style="font-family: monospace; background: #ffffff; padding: 2px 6px; border-radius: 4px;">{username}</strong></p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #2d184c;">Temporary Password: <strong style="font-family: monospace; background: #ffffff; padding: 2px 6px; border-radius: 4px;">{temporary_password}</strong></p>
            </td>
          </tr>
        </table>
        """

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your PeBlo Studio Account Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf8fd; font-family: 'Fredoka', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d184c;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #faf8fd; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="580" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(84, 52, 136, 0.08); border: 2px solid rgba(84, 52, 136, 0.12);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #543488 0%, #3e2268 100%); padding: 36px 20px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: 0.02em;">
                PeBlo Kids TV
              </h1>
              <p style="color: rgba(255, 255, 255, 0.85); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; margin: 6px 0 0;">
                Studio CMS & Catalogue Portal
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="color: #543488; font-size: 20px; font-weight: 800; margin: 0 0 14px;">
                {display_greeting}
              </h2>
              <p style="color: #4b3869; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                You have been appointed to <strong>PeBlo Kids TV Studio</strong> as an <strong>{role}</strong> with username <strong style="color: #543488;">{handle_str}</strong>.
              </p>

              {temp_pass_block}

              <p style="color: #4b3869; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
                Please click the button below to verify your account and configure your secure password:
              </p>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="{setup_url}" target="_blank" style="display: inline-block; background-color: #543488; color: #ffffff; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 34px; border-radius: 12px; box-shadow: 0 4px 14px rgba(84, 52, 136, 0.35); text-transform: none;">
                      Verify & Set Password →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(84, 52, 136, 0.04); border-radius: 12px; border: 1px dashed rgba(84, 52, 136, 0.2); margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 18px; font-size: 13px; color: #543488; line-height: 1.5;">
                    ⏱️ <strong>Security Note:</strong> This invitation link is valid for <strong>{expires_days} days</strong>. If you did not expect this invite, please notify your administrator.
                  </td>
                </tr>
              </table>

              <p style="color: #7d6b97; font-size: 12px; line-height: 1.5; margin: 0;">
                If the button above doesn't work, copy and paste this link into your browser:<br>
                <a href="{setup_url}" style="color: #543488; word-break: break-all; text-decoration: underline;">{setup_url}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #faf8fd; padding: 20px; border-top: 1px solid rgba(84, 52, 136, 0.08); text-align: center;">
              <p style="color: #8c7ba6; font-size: 12px; margin: 0;">
                © 2026 PeBlo TV Mini. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def build_setup_email_text(
    recipient_email: str,
    setup_url: str,
    expires_days: int = 7,
    user_name: Optional[str] = None,
    username: Optional[str] = None,
    role: str = "Editor",
    temporary_password: Optional[str] = None,
) -> str:
    """Plain text fallback version of the setup email."""
    name_str = f" ({user_name}, {recipient_email})" if user_name else f" ({recipient_email})"
    user_handle = f"@{username}" if username else recipient_email
    temp_pwd_str = f"\nTemporary Password: {temporary_password}\n" if temporary_password else ""

    return f"""Welcome to PeBlo Kids TV Studio!

An administrator has appointed you as an {role} with username {user_handle}{name_str}.
{temp_pwd_str}
Please verify your email and set your account password by visiting the following link:

{setup_url}

This invitation link is valid for {expires_days} days.

If you did not expect this invitation, you can safely disregard this email.

---
PeBlo Kids TV Studio CMS
"""


def send_password_setup_email(
    recipient_email: str,
    setup_url: str,
    expires_days: int = 7,
    user_name: Optional[str] = None,
    username: Optional[str] = None,
    role: str = "Editor",
    temporary_password: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Sends the password setup & email verification email to the recipient.
    If SMTP is configured, sends via SMTP server with TLS/SSL.
    Otherwise, logs to server console and returns simulation status.
    """
    clean_email = recipient_email.strip().lower()

    if not settings.SMTP_HOST:
        logger.info(
            f"[EMAIL SERVICE - DEV SIMULATION] Setup email generated for {clean_email} (Username: @{username or 'N/A'}, Role: {role}):\n"
            f"Setup URL: {setup_url}\n"
            f"Temp Password: {temporary_password or 'N/A'}"
        )
        return {
            "sent": True,
            "simulated": True,
            "email": clean_email,
            "setup_url": setup_url,
            "message": f"Invitation email simulated for {clean_email} (@{username or 'N/A'}). SMTP is in local development mode.",
        }

    try:
        from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER or "noreply@peblo.tv"
        from_header = f"{settings.SMTP_FROM_NAME} <{from_email}>" if settings.SMTP_FROM_NAME else from_email

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Welcome to PeBlo Studio — Invitation for @{username or clean_email}"
        msg["From"] = from_header
        msg["To"] = clean_email

        # Attach text and html parts
        text_content = build_setup_email_text(
            clean_email, setup_url, expires_days, user_name=user_name, username=username, role=role, temporary_password=temporary_password
        )
        html_content = build_setup_email_html(
            clean_email, setup_url, expires_days, user_name=user_name, username=username, role=role, temporary_password=temporary_password
        )

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # Connect and send
        if settings.SMTP_SSL:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            if settings.SMTP_TLS:
                server.starttls()

        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

        server.sendmail(from_email, [clean_email], msg.as_string())
        server.quit()

        logger.info(f"[EMAIL SERVICE - DELIVERED] Password setup email successfully sent to {clean_email}")
        return {
            "sent": True,
            "simulated": False,
            "email": clean_email,
            "setup_url": setup_url,
            "message": f"Setup invitation email sent successfully to {clean_email}.",
        }

    except Exception as exc:
        logger.error(f"[EMAIL SERVICE - ERROR] Failed to send email to {clean_email}: {exc}", exc_info=True)
        return {
            "sent": False,
            "simulated": False,
            "email": clean_email,
            "setup_url": setup_url,
            "message": f"Failed to send email via SMTP ({exc}). Please check SMTP credentials in .env.",
        }
