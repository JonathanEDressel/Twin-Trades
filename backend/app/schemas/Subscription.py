from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from app.models.SubscriptionModel import SubscriptionPlan, SubscriptionStatus


class SubscriptionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    plan: SubscriptionPlan
    status: SubscriptionStatus
    apple_transaction_id: str
    amount_paid: Decimal
    currency: str
    expires_at: datetime | None
    created_at: datetime


class VerifyApplePayload(BaseModel):
    transaction_id: str
    product_id: str   # com.twintrades.app.monthly | annual | lifetime


class AppleWebhookPayload(BaseModel):
    signedPayload: str   # JWT signed by Apple
