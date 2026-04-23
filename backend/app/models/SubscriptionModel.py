import enum
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum as SAEnum,
    ForeignKey, Numeric
)
from app.models.Base import Base


class SubscriptionPlan(str, enum.Enum):
    monthly = "monthly"
    annual = "annual"
    lifetime = "lifetime"


class SubscriptionStatus(str, enum.Enum):
    active = "active"
    expired = "expired"
    cancelled = "cancelled"
    grace_period = "grace_period"


def _now():
    return datetime.now(timezone.utc)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan = Column(SAEnum(SubscriptionPlan), nullable=False)
    status = Column(SAEnum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.active)
    apple_transaction_id = Column(String(255), unique=True, nullable=False)
    apple_original_transaction_id = Column(String(255), nullable=True)
    amount_paid = Column(Numeric(18, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    expires_at = Column(DateTime(timezone=True), nullable=True)   # null for lifetime
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)
