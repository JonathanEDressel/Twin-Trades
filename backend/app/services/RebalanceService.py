from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.RebalanceDbContext import RebalanceDbContext
from app.controllers.PortfolioDbContext import PortfolioDbContext
from app.models.TradeModel import RebalanceEvent, RebalanceEventStatus
from app.schemas.Rebalance import PendingRebalanceResponse, RebalanceHoldingSnapshot, ConfirmRebalanceResponse
from app.helper.ErrorHandler import NotFoundError, ForbiddenError


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

    async def list_pending(self, user_id: int) -> list[PendingRebalanceResponse]:
        events = await self.rebalance_db.find_pending_for_user(user_id)
        result = []
        for event in events:
            holdings = await self.rebalance_db.find_event_holdings(event.id)
            result.append(PendingRebalanceResponse(
                id=event.id,
                portfolio_id=event.portfolio_id,
                deep_link=event.deep_link,
                expires_at=event.expires_at,
                holdings=[RebalanceHoldingSnapshot.model_validate(h) for h in holdings],
                created_at=event.created_at,
            ))
        return result

    async def confirm(self, event_id: int, user_id: int) -> ConfirmRebalanceResponse:
        event = await self.rebalance_db.find_by_id(event_id)
        if event is None or event.status != RebalanceEventStatus.pending_confirmation:
            raise NotFoundError("Rebalance not found or no longer pending")
        membership = await self.portfolio_db.find_user_portfolio(user_id, event.portfolio_id)
        if membership is None:
            raise ForbiddenError("You are not a member of this portfolio")
        await self.rebalance_db.set_status(
            event_id,
            RebalanceEventStatus.confirmed,
            confirmed_at=datetime.now(timezone.utc),
        )
        await self.session.commit()
        return ConfirmRebalanceResponse(
            event_id=event_id,
            status="confirmed",
            message="Rebalance confirmed. Trades queued.",
        )

    async def reject(self, event_id: int, user_id: int) -> ConfirmRebalanceResponse:
        event = await self.rebalance_db.find_by_id(event_id)
        if event is None or event.status != RebalanceEventStatus.pending_confirmation:
            raise NotFoundError("Rebalance not found or no longer pending")
        membership = await self.portfolio_db.find_user_portfolio(user_id, event.portfolio_id)
        if membership is None:
            raise ForbiddenError("You are not a member of this portfolio")
        await self.rebalance_db.set_status(event_id, RebalanceEventStatus.rejected)
        await self.session.commit()
        return ConfirmRebalanceResponse(
            event_id=event_id,
            status="rejected",
            message="Rebalance rejected.",
        )

    async def expire_pending(self) -> int:
        # Fetch all rebalance events where status = "pending_confirmation" and expires_at < now().
        # Set their status to "expired" and return the count of expired events.
        # Called by the PendingRebalances cron job every 30 minutes.
        pass
