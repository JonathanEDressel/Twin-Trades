from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.PortfolioDbContext import PortfolioDbContext
from app.controllers.SubscriptionDbContext import SubscriptionDbContext
from app.models.PortfolioModel import Portfolio, UserPortfolio
from app.schemas.Portfolio import PortfolioResponse, PortfolioHoldingResponse


class PortfolioService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.portfolio_db = PortfolioDbContext(session)
        self.subscription_db = SubscriptionDbContext(session)

    async def list_marketplace(self, user_id: int) -> list[Portfolio]:
        # Return all active portfolios the user has not already joined.
        # Gate: user must have an active subscription or subscription_exempt = True — raise ForbiddenError otherwise.
        # Include holdings for each portfolio for display in the marketplace view.
        pass

    async def get_my_portfolios(self, user_id: int) -> list[PortfolioResponse]:
        portfolios = await self.portfolio_db.find_user_portfolios(user_id)
        result = []
        for p in portfolios:
            holdings = await self.portfolio_db.find_holdings(p.id)
            result.append(PortfolioResponse(
                id=p.id,
                name=p.name,
                description=p.description,
                is_active=p.is_active,
                total_return_pct=p.total_return_pct,
                holdings=[PortfolioHoldingResponse.model_validate(h) for h in holdings],
                created_at=p.created_at,
            ))
        return result

    async def get_detail(self, portfolio_id: int, user_id: int) -> Portfolio:
        # Return full portfolio detail including holdings and return metrics.
        # Raise NotFoundError if the portfolio does not exist or is_active = False.
        pass

    async def join(self, user_id: int, portfolio_id: int) -> UserPortfolio:
        # Verify the user is not already a member; raise ConflictError if they are.
        # Confirm the user has an active subscription before allowing the join.
        # Insert the user_portfolios row and trigger an initial buy rebalance event.
        pass

    async def leave(self, user_id: int, portfolio_id: int) -> None:
        # Set left_at = now() on the user_portfolios row.
        # Cancel any pending rebalance confirmations for this user+portfolio.
        # Raise NotFoundError if the user is not an active member.
        pass
