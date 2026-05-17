from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
from datetime import datetime, timezone
from app.helper.Database import get_session
from app.middleware.AuthMiddleware import get_current_user
from app.schemas.Subscription import (
    SubscriptionResponse, VerifyApplePayload, BillingEventResponse, PaginatedBillingHistoryResponse,
)
from app.controllers.SubscriptionDbContext import SubscriptionDbContext
from app.models.SubscriptionModel import SubscriptionPlan, SubscriptionStatus
from app.services.SubscriptionService import SubscriptionService

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
async def verify_apple(
    body: VerifyApplePayload,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    subscription = await SubscriptionService(session).verify_apple_transaction(
        current_user.id, body.transaction_id, body.product_id
    )
    await session.commit()
    return subscription


@router.post("/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if current_user.subscription_exempt:
        from app.helper.ErrorHandler import NotFoundError
        raise NotFoundError("Exempt accounts do not have a cancellable subscription")
    subscription = await SubscriptionDbContext(session).cancel_subscription(current_user.id)
    await session.commit()
    return subscription


@router.get("/billing-history", response_model=PaginatedBillingHistoryResponse)
async def billing_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    events, total = await SubscriptionDbContext(session).get_billing_history(
        current_user.id, page, page_size
    )
    return PaginatedBillingHistoryResponse(
        events=[BillingEventResponse.model_validate(e) for e in events],
        total=total,
        page=page,
        page_size=page_size,
    )
