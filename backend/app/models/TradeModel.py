import enum
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, DateTime, Enum as SAEnum,
    ForeignKey, Numeric, Text
)
from app.models.Base import Base


class TradeAction(str, enum.Enum):
    buy = "buy"
    sell = "sell"


class TradeStatus(str, enum.Enum):
    pending = "pending"
    filled = "filled"
    cancelled = "cancelled"
    failed = "failed"


class RebalanceEventStatus(str, enum.Enum):
    pending_confirmation = "pending_confirmation"
    confirmed = "confirmed"
    rejected = "rejected"
    expired = "expired"
    executing = "executing"
    completed = "completed"
    failed = "failed"


def _now():
    return datetime.now(timezone.utc)


class RebalanceEvent(Base):
    __tablename__ = "rebalance_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    triggered_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(SAEnum(RebalanceEventStatus), nullable=False,
                    default=RebalanceEventStatus.pending_confirmation)
    deep_link = Column(String(500), nullable=True)   # twintrades://rebalance/{event_id}
    expires_at = Column(DateTime(timezone=True), nullable=False)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)


class RebalanceEventHolding(Base):
    """Snapshot of target allocations at the time the rebalance was triggered."""
    __tablename__ = "rebalance_event_holdings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("rebalance_events.id", ondelete="CASCADE"), nullable=False)
    ticker = Column(String(10), nullable=False)
    target_pct = Column(Numeric(18, 2), nullable=False)


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rebalance_event_id = Column(Integer, ForeignKey("rebalance_events.id", ondelete="SET NULL"),
                                nullable=True)
    brokerage_connection_id = Column(Integer, ForeignKey("brokerage_connections.id",
                                                         ondelete="SET NULL"), nullable=True)
    ticker = Column(String(10), nullable=False)
    action = Column(SAEnum(TradeAction), nullable=False)
    quantity = Column(Numeric(18, 2), nullable=False)
    price = Column(Numeric(18, 2), nullable=True)
    status = Column(SAEnum(TradeStatus), nullable=False, default=TradeStatus.pending)
    broker_order_id = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    executed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
