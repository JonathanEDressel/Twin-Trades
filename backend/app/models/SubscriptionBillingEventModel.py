import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, DateTime, Enum as SAEnum,
    ForeignKey, Numeric,
)
from app.models.Base import Base


class BillingEventType(str, enum.Enum):
    payment_success = "payment_success"
    payment_failed = "payment_failed"
    renewal = "renewal"
    refund = "refund"
    cancellation = "cancellation"


def _now() -> datetime:
    return datetime.now(timezone.utc)


class SubscriptionBillingEvent(Base):
    __tablename__ = "subscription_billing_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(SAEnum(BillingEventType), nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    apple_transaction_id = Column(String(255), nullable=True)
    occurred_at = Column(DateTime(timezone=True), default=_now, nullable=False)
