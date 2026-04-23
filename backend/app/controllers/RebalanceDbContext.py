from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.models.TradeModel import RebalanceEvent, RebalanceEventHolding


class RebalanceDbContext:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_pending_for_user(self, user_id: int) -> list[RebalanceEvent]:
        # Return all rebalance events with status = "pending_confirmation" for portfolios the user follows.
        # Join user_portfolios to scope results to the user's active memberships only.
        # Exclude events where expires_at < now().
        pass

    async def find_by_id(self, event_id: int) -> RebalanceEvent | None:
        # Fetch a single RebalanceEvent by primary key including its EventHolding rows.
        # Return None if not found — callers raise NotFoundError.
        pass

    async def insert_pending_rebalance(self, portfolio_id: int, triggered_by_id: int, expires_at: datetime, deep_link: str) -> RebalanceEvent:
        # Insert a new RebalanceEvent row with status = "pending_confirmation".
        # Flush and return the new object so the caller can get the auto-generated id for the deep link.
        pass

    async def set_status(self, event_id: int, status: str, confirmed_at: datetime | None = None) -> None:
        # UPDATE the status (and optionally confirmed_at) on the rebalance_events row.
        # Used by confirm, reject, expiry job, and execution completion handlers.
        pass

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
