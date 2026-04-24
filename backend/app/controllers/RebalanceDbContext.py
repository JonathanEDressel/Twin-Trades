from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timezone
from app.models.TradeModel import RebalanceEvent, RebalanceEventHolding, RebalanceEventStatus
from app.models.PortfolioModel import UserPortfolio


class RebalanceDbContext:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_pending_for_user(self, user_id: int) -> list[RebalanceEvent]:
        result = await self.session.execute(
            select(RebalanceEvent)
            .join(UserPortfolio, UserPortfolio.portfolio_id == RebalanceEvent.portfolio_id)
            .where(
                UserPortfolio.user_id == user_id,
                UserPortfolio.left_at.is_(None),
                RebalanceEvent.status == RebalanceEventStatus.pending_confirmation,
                RebalanceEvent.expires_at > datetime.now(timezone.utc),
            )
        )
        return list(result.scalars().all())

    async def find_by_id(self, event_id: int) -> RebalanceEvent | None:
        result = await self.session.execute(
            select(RebalanceEvent).where(RebalanceEvent.id == event_id)
        )
        return result.scalar_one_or_none()

    async def find_event_holdings(self, event_id: int) -> list[RebalanceEventHolding]:
        result = await self.session.execute(
            select(RebalanceEventHolding).where(RebalanceEventHolding.event_id == event_id)
        )
        return list(result.scalars().all())

    async def insert_pending_rebalance(self, portfolio_id: int, triggered_by_id: int, expires_at: datetime, deep_link: str) -> RebalanceEvent:
        # Insert a new RebalanceEvent row with status = "pending_confirmation".
        # Flush and return the new object so the caller can get the auto-generated id for the deep link.
        pass

    async def set_status(self, event_id: int, status: RebalanceEventStatus, confirmed_at: datetime | None = None) -> None:
        values: dict = {"status": status}
        if confirmed_at is not None:
            values["confirmed_at"] = confirmed_at
        await self.session.execute(
            update(RebalanceEvent)
            .where(RebalanceEvent.id == event_id)
            .values(**values)
        )

    async def find_expired_pending(self) -> list[RebalanceEvent]:
        # Return all events with status = "pending_confirmation" and expires_at < now().
        # Called by the PendingRebalances cron job every 30 minutes.
        pass

    async def insert_rebalance_event(self, portfolio_id: int, triggered_by_id: int | None) -> RebalanceEvent:
        # Insert a confirmed rebalance event (status = "confirmed") that skips the user confirmation step.
        # Used internally when the admin force-triggers a rebalance without user approval.
        pass

    async def insert_event_holdings(self, event_id: int, holdings: list[dict]) -> None:
        # Bulk-insert RebalanceEventHolding rows capturing the allocation snapshot at trigger time.
        # Each dict has keys: ticker (str), target_pct (Decimal).
        pass
