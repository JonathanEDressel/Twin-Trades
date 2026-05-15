from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
from datetime import datetime, timezone
from app.helper.Database import get_session
from app.middleware.AuthMiddleware import get_current_user
from app.schemas.Subscription import SubscriptionResponse, VerifyApplePayload
from app.controllers.SubscriptionDbContext import SubscriptionDbContext
from app.models.SubscriptionModel import SubscriptionPlan, SubscriptionStatus

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/status", response_model=SubscriptionResponse | None)
async def get_status(current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    if current_user.subscription_exempt:
        return SubscriptionResponse(
            id=0,
            plan=SubscriptionPlan.lifetime,
            status=SubscriptionStatus.active,
            apple_transaction_id="exempt",
            amount_paid=Decimal("0"),
            currency="USD",
            expires_at=None,
            created_at=datetime.now(timezone.utc),
        )
    return await SubscriptionDbContext(session).find_active_for_user(current_user.id)


@router.post("/verify-apple", response_model=SubscriptionResponse)
async def verify_apple(body: VerifyApplePayload, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Verify the Apple transaction ID with the App Store Server API via StorekitService.
    # Map the product_id to a SubscriptionPlan and upsert the subscription row.
    # Raise BadRequestError if Apple rejects the transaction or it belongs to a different user.
    pass
