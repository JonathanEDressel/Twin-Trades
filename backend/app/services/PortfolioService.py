from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.PortfolioDbContext import PortfolioDbContext
from app.controllers.SubscriptionDbContext import SubscriptionDbContext
from app.models.PortfolioModel import Portfolio, UserPortfolio
from app.schemas.Portfolio import PortfolioResponse, PortfolioHoldingResponse, MarketplaceResponse
from app.helper.ErrorHandler import NotFoundError, ForbiddenError, ConflictError


class PortfolioService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.portfolio_db = PortfolioDbContext(session)
        self.subscription_db = SubscriptionDbContext(session)

    async def _assert_subscription(self, user) -> None:
        if user.subscription_exempt:
            return
        sub = await self.subscription_db.find_active_for_user(user.id)
        if sub is None:
            raise ForbiddenError("An active subscription is required")

    async def _build_response(self, portfolio: Portfolio) -> PortfolioResponse:
        holdings = await self.portfolio_db.find_holdings(portfolio.id)
        return PortfolioResponse(
            id=portfolio.id,
            name=portfolio.name,
            description=portfolio.description,
            is_active=portfolio.is_active,
            total_return_pct=portfolio.total_return_pct,
            holdings=[PortfolioHoldingResponse.model_validate(h) for h in holdings],
            created_at=portfolio.created_at,
        )

    async def list_marketplace(self, user, page: int, page_size: int) -> MarketplaceResponse:
        await self._assert_subscription(user)

        joined_portfolios = await self.portfolio_db.find_user_portfolios(user.id)
        joined_ids = {p.id for p in joined_portfolios}

        all_active = await self.portfolio_db.find_all_active()
        available = [p for p in all_active if p.id not in joined_ids]
        total = len(available)
        page_items = available[(page - 1) * page_size: page * page_size]

        portfolios = [await self._build_response(p) for p in page_items]
        return MarketplaceResponse(portfolios=portfolios, total=total, page=page, page_size=page_size)

    async def get_my_portfolios(self, user_id: int) -> list[PortfolioResponse]:
        portfolios = await self.portfolio_db.find_user_portfolios(user_id)
        return [await self._build_response(p) for p in portfolios]

    async def get_detail(self, portfolio_id: int, user_id: int) -> PortfolioResponse:
        portfolio = await self.portfolio_db.find_by_id(portfolio_id)
        if portfolio is None:
            raise NotFoundError("Portfolio not found")
        return await self._build_response(portfolio)

    async def join(self, user, portfolio_id: int) -> UserPortfolio:
        portfolio = await self.portfolio_db.find_by_id(portfolio_id)
        if portfolio is None:
            raise NotFoundError("Portfolio not found")

        existing = await self.portfolio_db.find_user_portfolio(user.id, portfolio_id)
        if existing is not None:
            raise ConflictError("Already a member of this portfolio")

        await self._assert_subscription(user)

        up = await self.portfolio_db.insert_user_portfolio(user.id, portfolio_id)
        await self.session.commit()
        # TODO: trigger execute_initial_buy via TradeService
        return up

    async def leave(self, user_id: int, portfolio_id: int) -> None:
        existing = await self.portfolio_db.find_user_portfolio(user_id, portfolio_id)
        if existing is None:
            raise NotFoundError("Not a member of this portfolio")

        await self.portfolio_db.set_user_portfolio_left_at(user_id, portfolio_id)
        await self.session.commit()
        # TODO: cancel pending rebalances and trigger execute_full_sell via TradeService
