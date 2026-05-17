from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update
from app.models.SubscriptionModel import Subscription, SubscriptionStatus, SubscriptionPlan
from app.models.SubscriptionBillingEventModel import SubscriptionBillingEvent, BillingEventType
from app.helper.ErrorHandler import BadRequestError, NotFoundError


class SubscriptionDbContext:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_active_for_user(self, user_id: int) -> Subscription | None:
        result = await self.session.execute(
            select(Subscription)
            .where(
                Subscription.user_id == user_id,
                Subscription.status.in_([SubscriptionStatus.active, SubscriptionStatus.grace_period]),
            )
            .order_by(desc(Subscription.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def upsert_by_transaction_id(self, user_id: int, transaction_id: str, **kwargs) -> Subscription:
        """Idempotent — insert or update the subscription row for this Apple transaction ID."""
        result = await self.session.execute(
            select(Subscription).where(Subscription.apple_transaction_id == transaction_id)
        )
        existing = result.scalar_one_or_none()
        if existing is not None:
            if existing.user_id != user_id:
                raise BadRequestError("Transaction belongs to a different account")
            for key, value in kwargs.items():
                setattr(existing, key, value)
            await self.session.flush()
            return existing
        new_sub = Subscription(user_id=user_id, apple_transaction_id=transaction_id, **kwargs)
        self.session.add(new_sub)
        await self.session.flush()
        return new_sub

    async def update_status(
        self,
        subscription_id: int,
        status: SubscriptionStatus,
        expires_at: datetime | None = None,
    ) -> None:
        """Used by the Apple webhook handler and SubscriptionSync cron."""
        values: dict = {"status": status}
        if expires_at is not None:
            values["expires_at"] = expires_at
        await self.session.execute(
            update(Subscription)
            .where(Subscription.id == subscription_id)
            .values(**values)
            .execution_options(synchronize_session=False)
        )

    async def count_by_plan_and_status(self, plan: SubscriptionPlan, status: SubscriptionStatus) -> int:
        """Used by the revenue metrics endpoint."""
        result = await self.session.execute(
            select(func.count()).select_from(Subscription).where(
                Subscription.plan == plan,
                Subscription.status == status,
            )
        )
        return result.scalar_one()

    async def insert_billing_event(
        self,
        user_id: int,
        subscription_id: int | None,
        event_type: BillingEventType,
        amount: Decimal,
        currency: str = "USD",
        apple_transaction_id: str | None = None,
    ) -> SubscriptionBillingEvent:
        event = SubscriptionBillingEvent(
            user_id=user_id,
            subscription_id=subscription_id,
            event_type=event_type,
            amount=amount,
            currency=currency,
            apple_transaction_id=apple_transaction_id,
        )
        self.session.add(event)
        await self.session.flush()
        return event

    async def cancel_subscription(self, user_id: int) -> Subscription:
        """Marks the user's active/grace_period subscription as cancelled."""
        result = await self.session.execute(
            select(Subscription)
            .where(
                Subscription.user_id == user_id,
                Subscription.status.in_([SubscriptionStatus.active, SubscriptionStatus.grace_period]),
            )
            .order_by(desc(Subscription.created_at))
            .limit(1)
        )
        sub = result.scalar_one_or_none()
        if sub is None:
            raise NotFoundError("No active subscription found")
        sub.status = SubscriptionStatus.cancelled
        sub.cancelled_at = datetime.now(timezone.utc)
        await self.session.flush()
        return sub

    async def get_billing_history(
        self, user_id: int, page: int, page_size: int
    ) -> tuple[list[SubscriptionBillingEvent], int]:
        offset = (page - 1) * page_size
        result = await self.session.execute(
            select(SubscriptionBillingEvent)
            .where(SubscriptionBillingEvent.user_id == user_id)
            .order_by(desc(SubscriptionBillingEvent.occurred_at))
            .offset(offset)
            .limit(page_size)
        )
        events = list(result.scalars().all())
        count_result = await self.session.execute(
            select(func.count())
            .select_from(SubscriptionBillingEvent)
            .where(SubscriptionBillingEvent.user_id == user_id)
        )
        total = count_result.scalar_one()
        return events, total
