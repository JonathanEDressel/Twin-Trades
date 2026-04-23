from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal


class RebalanceHoldingSnapshot(BaseModel):
    model_config = {"from_attributes": True}

    ticker: str
    target_pct: Decimal


class PendingRebalanceResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    portfolio_id: int
    deep_link: str | None
    expires_at: datetime
    holdings: list[RebalanceHoldingSnapshot] = []
    created_at: datetime


class ConfirmRebalanceResponse(BaseModel):
    event_id: int
    status: str
    message: str
