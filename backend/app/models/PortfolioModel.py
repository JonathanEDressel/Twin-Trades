import enum
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum as SAEnum,
    ForeignKey, Text, Numeric
)
from app.models.Base import Base


def _now():
    return datetime.now(timezone.utc)


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    total_return_pct = Column(Numeric(18, 2), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)


class PortfolioHolding(Base):
    __tablename__ = "portfolio_holdings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    ticker = Column(String(10), nullable=False)
    target_pct = Column(Numeric(18, 2), nullable=False)   # must sum to 100 per portfolio
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)


class UserPortfolio(Base):
    """Join table tracking which users follow which portfolios."""
    __tablename__ = "user_portfolios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    left_at = Column(DateTime(timezone=True), nullable=True)


class PortfolioSnapshot(Base):
    """Daily NAV snapshot per portfolio for performance charts."""
    __tablename__ = "portfolio_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    snapshot_date = Column(DateTime(timezone=True), default=_now, nullable=False)
    total_value = Column(Numeric(18, 2), nullable=False)
