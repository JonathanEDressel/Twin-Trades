from app.helper.Config import settings
from pathlib import Path


async def send_email(to: str, subject: str, html_body: str) -> None:
    # Connect to the SMTP server using settings.SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS via aiosmtplib.
    # Send the HTML email from EMAIL_FROM to the recipient address with STARTTLS enabled.
    # Raise on connection or authentication failure; swallow and log delivery errors after 3 retries.
    pass


async def render_template(name: str, context: dict) -> str:
    # Load the Jinja2 template file from the templates/ directory by name.
    # Render the template with the provided context dict and return the resulting HTML string.
    # Raise FileNotFoundError if the template file does not exist.
    pass
