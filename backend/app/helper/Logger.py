import structlog
from app.helper.Config import settings


def configure_logging() -> None:
    # Configure structlog with JSON output in production and pretty console output in development.
    # Bind request_id and user_id processors so every log line carries tracing context automatically.
    # Route Python stdlib logging through structlog so third-party library logs are unified.
    pass


logger = structlog.get_logger()
