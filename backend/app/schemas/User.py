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
