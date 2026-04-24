from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.PortfolioModel import Portfolio, PortfolioHolding, UserPortfolio


class PortfolioDbContext:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_all_active(self) -> list[Portfolio]:
        # Return all portfolios where is_active = True, ordered by name ASC.
        # Eagerly load holdings for each portfolio so callers don't trigger lazy-load errors.
        pass

    async def find_by_id(self, portfolio_id: int) -> Portfolio | None:
        # Fetch a single portfolio by primary key; return None if not found or is_active = False.
        # Eagerly load holdings in the same query to avoid N+1.
        pass

    async def find_holdings(self, portfolio_id: int) -> list[PortfolioHolding]:
        result = await self.session.execute(
            select(PortfolioHolding)
            .where(PortfolioHolding.portfolio_id == portfolio_id)
            .order_by(PortfolioHolding.ticker)
        )
        return list(result.scalars().all())

    async def replace_holdings(self, portfolio_id: int, holdings: list[dict]) -> None:
        # Delete all existing holdings for the portfolio, then bulk-insert the new list.
        # Each dict in holdings has keys: ticker (str), target_pct (Decimal).
        # Wrap both operations in a single transaction — never leave the portfolio with zero holdings.
        pass

    async def find_user_portfolio(self, user_id: int, portfolio_id: int) -> UserPortfolio | None:
        result = await self.session.execute(
            select(UserPortfolio).where(
                UserPortfolio.user_id == user_id,
                UserPortfolio.portfolio_id == portfolio_id,
                UserPortfolio.left_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def find_user_portfolios(self, user_id: int) -> list[Portfolio]:
        result = await self.session.execute(
            select(Portfolio)
            .join(UserPortfolio, UserPortfolio.portfolio_id == Portfolio.id)
            .where(
                UserPortfolio.user_id == user_id,
                UserPortfolio.left_at.is_(None),
            )
        )
        return list(result.scalars().all())

    async def find_syncing_users(self, portfolio_id: int) -> list[int]:
        # Return a list of user_ids that are actively following the given portfolio.
        # Used by TradeService to fan out rebalance orders to each enrolled user.
        pass

    async def insert_user_portfolio(self, user_id: int, portfolio_id: int) -> UserPortfolio:
        # Insert a new user_portfolios row with joined_at = now() and left_at = None.
        # Flush and return the new object.
        pass

    async def update_portfolio(self, portfolio_id: int, **kwargs) -> Portfolio | None:
        # Apply keyword-argument field updates to the portfolio row via SQLAlchemy update().
        # Return the updated Portfolio object, or None if portfolio_id does not exist.
        pass
