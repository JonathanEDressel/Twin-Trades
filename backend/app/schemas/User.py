from pydantic import BaseModel
from datetime import datetime
from app.models.UserModel import UserRole, RebalanceConfirmation


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    email: str
    username: str
    display_name: str | None
    avatar_url: str | None
    role: UserRole
    rebalance_confirmation: RebalanceConfirmation
    is_active: bool
    subscription_exempt: bool
    created_at: datetime


class UserUpdatePayload(BaseModel):
    display_name: str | None = None
    avatar_url: str | None = None
    rebalance_confirmation: RebalanceConfirmation | None = None
    phone_number: str | None = None
    apns_device_token: str | None = None


class AdminUserUpdatePayload(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None
    subscription_exempt: bool | None = None
    username: str | None = None
    email: str | None = None
    display_name: str | None = None
    password: str | None = None


class AdminUserResponse(BaseModel):
    id: int
    email: str
    username: str
    display_name: str | None
    avatar_url: str | None
    role: UserRole
    is_active: bool
    subscription_exempt: bool
    created_at: datetime
    subscription_status: str | None
    subscription_plan: str | None
    portfolio_count: int
    invested_amount: str


class PaginatedUsersResponse(BaseModel):
    users: list[AdminUserResponse]
    total: int
    page: int
    page_size: int
