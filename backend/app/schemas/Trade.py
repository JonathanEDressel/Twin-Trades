from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from app.models.TradeModel import TradeAction, TradeStatus


class TradeResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    ticker: str
    action: TradeAction
    quantity: Decimal
    price: Decimal | None
    status: TradeStatus
    broker_order_id: str | None
    executed_at: datetime | None
    created_at: datetime


class TradeHistoryResponse(BaseModel):
    trades: list[TradeResponse]
    total: int
    page: int
    page_size: int
