import asyncio
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from jinja2 import Environment, FileSystemLoader, TemplateNotFound
from app.helper.Config import settings
from pathlib import Path

_TEMPLATE_DIR = Path(__file__).parent.parent / "templates"


async def send_email(to: str, subject: str, html_body: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html"))

    last_exc: Exception | None = None
    for attempt in range(3):
        try:
            await aiosmtplib.send(
                msg,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASS,
                start_tls=True,
            )
            return
        except Exception as exc:
            last_exc = exc
            if attempt < 2:
                await asyncio.sleep(2 ** attempt)

    import logging
    logging.getLogger(__name__).error("Failed to send email to %s: %s", to, last_exc)


async def render_template(name: str, context: dict) -> str:
    env = Environment(
        loader=FileSystemLoader(str(_TEMPLATE_DIR)),
        autoescape=True,
    )
    try:
        template = env.get_template(name)
    except TemplateNotFound:
        raise FileNotFoundError(f"Email template '{name}' not found")
    return template.render(**context)
