from pydantic import BaseModel
from datetime import datetime


class ChangeLogEntryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    actor_id: int | None
    entity_type: str    # "portfolio" | "user" | "subscription" | etc.
    entity_id: int | None
    action: str         # "create" | "update" | "delete" | "join" | "leave" | etc.
    detail: str | None
    created_at: datetime


class PaginatedChangeLogResponse(BaseModel):
    entries: list[ChangeLogEntryResponse]
    total: int
    page: int
    page_size: int


class ErrorLogResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    path: str | None
    method: str | None
    status_code: int | None
    message: str
    traceback: str | None
    created_at: datetime


class PaginatedLogsResponse(BaseModel):
    logs: list[ErrorLogResponse]
    total: int
    page: int
    page_size: int


class RevenueStatsResponse(BaseModel):
    total_revenue: str
    monthly_revenue: str
    active_subscriptions: int
    plan_breakdown: dict[str, int]
