from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal


class PortfolioHoldingResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    ticker: str
    target_pct: Decimal


class PortfolioHoldingHistoryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    ticker: str
    change_type: str
    target_pct: Decimal
    old_target_pct: Decimal | None
    changed_at: datetime


class PortfolioResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    description: str | None
    icon_url: str | None
    is_active: bool
    total_return_pct: Decimal | None
    return_1w: Decimal | None
    return_1m: Decimal | None
    return_3m: Decimal | None
    return_6m: Decimal | None
    return_1y: Decimal | None
    return_3y: Decimal | None
    holdings: list[PortfolioHoldingResponse] = []
    created_at: datetime


class AdminPortfolioResponse(PortfolioResponse):
    holding_history: list[PortfolioHoldingHistoryResponse] = []
    user_count: int = 0
    total_invested: str = "0.00"


class MarketplaceResponse(BaseModel):
    portfolios: list[PortfolioResponse]
    total: int
    page: int
    page_size: int


class CreatePortfolioPayload(BaseModel):
    name: str
    description: str | None = None
    icon_url: str | None = None


class UpdatePortfolioPayload(BaseModel):
    name: str | None = None
    description: str | None = None
    icon_url: str | None = None


class UpdateHoldingsPayload(BaseModel):
    holdings: list[dict]   # [{"ticker": "AAPL", "target_pct": "45.00"}, ...]


class JoinPortfolioPayload(BaseModel):
    portfolio_id: int


class PaginatedPortfoliosResponse(BaseModel):
    portfolios: list[PortfolioResponse]
    total: int
    page: int
    page_size: int


class PaginatedAdminPortfoliosResponse(BaseModel):
    portfolios: list[AdminPortfolioResponse]
    total: int
    page: int
    page_size: int
