from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.SubscriptionDbContext import SubscriptionDbContext
from app.controllers.UserDbContext import UserDbContext
from app.models.SubscriptionModel import Subscription, SubscriptionStatus, SubscriptionPlan
from app.models.SubscriptionBillingEventModel import BillingEventType
from app.services.StorekitService import StorekitService
from app.helper.Config import settings
from app.helper.ErrorHandler import BadRequestError


class SubscriptionService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.subscription_db = SubscriptionDbContext(session)
        self.user_db = UserDbContext(session)

    async def is_active(self, user_id: int) -> bool:
        user = await self.user_db.find_by_id(user_id)
        if user and user.subscription_exempt:
            return True
        sub = await self.subscription_db.find_active_for_user(user_id)
        if sub is None:
            return False
        # Lifetime plans have expires_at = NULL (never expire).
        # For timed plans the cron keeps status current, but we double-check as a safety net.
        if sub.expires_at is not None:
            return sub.expires_at > datetime.now(timezone.utc)
        return True

    async def verify_apple_transaction(
        self, user_id: int, transaction_id: str, product_id: str
    ) -> Subscription:
        storekit = StorekitService()
        tx = await storekit.verify_transaction(transaction_id)

        if tx.get("bundleId") != settings.APPLE_BUNDLE_ID:
            raise BadRequestError("Transaction does not belong to this application")

        plan, amount_paid = storekit.map_product_to_plan(product_id)

        expires_at: datetime | None = None
        expires_date_ms = tx.get("expiresDate")
        if expires_date_ms is not None and plan != SubscriptionPlan.lifetime:
            expires_at = datetime.fromtimestamp(expires_date_ms / 1000, tz=timezone.utc)

        subscription = await self.subscription_db.upsert_by_transaction_id(
            user_id=user_id,
            transaction_id=transaction_id,
            plan=plan,
            status=SubscriptionStatus.active,
            amount_paid=amount_paid,
            currency="USD",
            expires_at=expires_at,
            apple_original_transaction_id=tx.get("originalTransactionId"),
        )

        await self.subscription_db.insert_billing_event(
            user_id=user_id,
            subscription_id=subscription.id,
            event_type=BillingEventType.payment_success,
            amount=amount_paid,
            currency="USD",
            apple_transaction_id=transaction_id,
        )

        return subscription

    async def handle_apple_notification(self, signed_payload: str) -> None:
        # Decode and verify the Apple server notification JWT via StorekitService.
        # Map notificationType (DID_RENEW, EXPIRED, REVOKE, etc.) to a SubscriptionStatus transition.
        # Update the relevant subscription row and log the event to change_log.
        pass
