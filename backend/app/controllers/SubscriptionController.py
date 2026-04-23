from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.helper.Database import get_session
from app.middleware.AuthMiddleware import get_current_user
from app.schemas.Subscription import SubscriptionResponse, VerifyApplePayload

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/status", response_model=SubscriptionResponse | None)
async def get_status(current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Return the user's currently active subscription record, or None if they have no subscription.
    # subscription_exempt users always get a synthetic "active" response without a DB row.
    # Call SubscriptionService.is_active to resolve exemptions and grace-period logic.
    pass


@router.post("/verify-apple", response_model=SubscriptionResponse)
async def verify_apple(body: VerifyApplePayload, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Verify the Apple transaction ID with the App Store Server API via StorekitService.
    # Map the product_id to a SubscriptionPlan and upsert the subscription row.
    # Raise BadRequestError if Apple rejects the transaction or it belongs to a different user.
    pass
