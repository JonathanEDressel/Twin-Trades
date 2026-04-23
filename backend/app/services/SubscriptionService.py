from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.SubscriptionDbContext import SubscriptionDbContext
from app.controllers.UserDbContext import UserDbContext
from app.models.SubscriptionModel import Subscription, SubscriptionStatus


class SubscriptionService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.subscription_db = SubscriptionDbContext(session)
        self.user_db = UserDbContext(session)

    async def is_active(self, user_id: int) -> bool:
        # Check subscription_exempt first — if True, return True immediately without a DB query.
        # Otherwise query for a subscription with status IN ("active", "grace_period") and expires_at > now().
        # Lifetime subscriptions have expires_at = NULL which must be treated as never-expiring.
        pass

    async def verify_apple_transaction(self, user_id: int, transaction_id: str, product_id: str) -> Subscription:
        # Call StorekitService.verify_transaction to validate the Apple receipt with the App Store Server API.
        # Map the product_id to a SubscriptionPlan enum and compute expires_at from the billing period.
        # Upsert the subscription row via SubscriptionDbContext.upsert_by_transaction_id.
        pass

    async def handle_apple_notification(self, signed_payload: str) -> None:
        # Decode and verify the Apple server notification JWT via StorekitService.
        # Map notificationType (DID_RENEW, EXPIRED, REVOKE, etc.) to a SubscriptionStatus transition.
        # Update the relevant subscription row and log the event to change_log.
        pass
