from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from app.models.SubscriptionModel import Subscription, SubscriptionStatus, SubscriptionPlan


class SubscriptionDbContext:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_active_for_user(self, user_id: int) -> Subscription | None:
        # Return the subscription row with status IN ("active", "grace_period") for the user.
        # Order by created_at DESC and return only the most recent; return None if none found.
        pass

    async def upsert_by_transaction_id(self, user_id: int, transaction_id: str, **kwargs) -> Subscription:
        # Insert a new subscription row or update the existing one matching apple_transaction_id.
        # This is safe to call multiple times for the same transaction (idempotent).
        # Return the final Subscription object regardless of whether it was inserted or updated.
        pass

    async def update_status(self, subscription_id: int, status: SubscriptionStatus, expires_at: datetime | None = None) -> None:
        # UPDATE status (and optionally expires_at) on the given subscription row.
        # Called by the Apple webhook handler and the SubscriptionSync cron job.
        pass

    async def count_by_plan_and_status(self, plan: SubscriptionPlan, status: SubscriptionStatus) -> int:
        # Return the count of subscription rows matching both plan and status.
        # Used by the revenue metrics endpoint to compute active subscriber counts per tier.
        pass
