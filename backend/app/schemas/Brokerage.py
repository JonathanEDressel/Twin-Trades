from pydantic import BaseModel
from datetime import datetime


class BrokerageConnectionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    brokerage_slug: str
    account_id: str | None
    is_active: bool
    token_expires_at: datetime | None
    created_at: datetime


class OAuthInitiateResponse(BaseModel):
    auth_url: str
    state: str


class OAuthCallbackPayload(BaseModel):
    code: str
    state: str
    brokerage_slug: str
