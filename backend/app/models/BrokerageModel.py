from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Text
)
from app.models.Base import Base


def _now():
    return datetime.now(timezone.utc)


class BrokerageConnection(Base):
    __tablename__ = "brokerage_connections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    brokerage_slug = Column(String(50), nullable=False)   # "webull" | "alpaca" | "schwab"
    access_token_enc = Column(Text, nullable=False)        # AES-256-GCM encrypted
    refresh_token_enc = Column(Text, nullable=True)        # AES-256-GCM encrypted
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    account_id = Column(String(255), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)
