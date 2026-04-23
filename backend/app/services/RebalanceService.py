from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.RebalanceDbContext import RebalanceDbContext
from app.controllers.PortfolioDbContext import PortfolioDbContext
from app.models.TradeModel import RebalanceEvent


class RebalanceService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.rebalance_db = RebalanceDbContext(session)
        self.portfolio_db = PortfolioDbContext(session)

    async def trigger_rebalance(self, portfolio_id: int, triggered_by_id: int) -> RebalanceEvent:
        # Fetch current holdings and snapshot them into rebalance_event_holdings.
        # Create a pending RebalanceEvent with a 30-minute TTL and generate the deep link URL.
        # Fan out push notifications via PushService to all enrolled users awaiting confirmation.
        pass

    async def confirm(self, event_id: int, user_id: int) -> RebalanceEvent:
        # Validate the event is still pending and belongs to a portfolio the user follows.
        # Update status to "confirmed" and enqueue trade execution via TradeService.execute_rebalance.
        # Raise NotFoundError if the event is expired, rejected, or already confirmed by this user.
        pass

    async def reject(self, event_id: int, user_id: int) -> RebalanceEvent:
        # Mark the event as rejected for this user; other users can still confirm their own events.
        # Log the rejection to change_log via ChangeLogService.record for admin audit.
        # Raise NotFoundError if the event does not exist or is already past the pending state.
        pass

    async def expire_pending(self) -> int:
        # Fetch all rebalance events where status = "pending_confirmation" and expires_at < now().
        # Set their status to "expired" and return the count of expired events.
        # Called by the PendingRebalances cron job every 30 minutes.
        pass
