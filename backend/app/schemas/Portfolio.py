from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal


class PortfolioHoldingResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    ticker: str
    target_pct: Decimal


class PortfolioResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    description: str | None
    is_active: bool
    total_return_pct: Decimal | None
    holdings: list[PortfolioHoldingResponse] = []
    created_at: datetime


class CreatePortfolioPayload(BaseModel):
    name: str
    description: str | None = None


class UpdateHoldingsPayload(BaseModel):
    holdings: list[dict]   # [{"ticker": "AAPL", "target_pct": "45.00"}, ...]


class JoinPortfolioPayload(BaseModel):
    portfolio_id: int
