from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from datetime import datetime, timezone
from app.models.PortfolioModel import Portfolio, PortfolioHolding, UserPortfolio, PortfolioHoldingHistory


class PortfolioDbContext:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_all_active(self) -> list[Portfolio]:
        result = await self.session.execute(
            select(Portfolio)
            .where(Portfolio.is_active == True)
            .order_by(Portfolio.name.asc())
        )
        return list(result.scalars().all())

    async def find_by_id(self, portfolio_id: int) -> Portfolio | None:
        result = await self.session.execute(
            select(Portfolio).where(
                Portfolio.id == portfolio_id,
                Portfolio.is_active == True,
            )
        )
        return result.scalar_one_or_none()

    async def find_holdings(self, portfolio_id: int) -> list[PortfolioHolding]:
        result = await self.session.execute(
            select(PortfolioHolding)
            .where(PortfolioHolding.portfolio_id == portfolio_id)
            .order_by(PortfolioHolding.ticker)
        )
        return list(result.scalars().all())

    async def replace_holdings(self, portfolio_id: int, holdings: list[dict]) -> None:
        await self.session.execute(
            delete(PortfolioHolding).where(PortfolioHolding.portfolio_id == portfolio_id)
        )
        for h in holdings:
            self.session.add(PortfolioHolding(
                portfolio_id=portfolio_id,
                ticker=str(h["ticker"]).upper(),
                target_pct=h["target_pct"],
            ))
        await self.session.flush()

    async def record_holding_history(
        self,
        portfolio_id: int,
        old_holdings: list[PortfolioHolding],
        new_holdings: list[dict],
        changed_by_id: int,
    ) -> None:
        from decimal import Decimal
        old_map = {h.ticker.upper(): h.target_pct for h in old_holdings}
        new_map = {str(h["ticker"]).upper(): Decimal(str(h["target_pct"])) for h in new_holdings}

        for ticker, new_pct in new_map.items():
            if ticker not in old_map:
                self.session.add(PortfolioHoldingHistory(
                    portfolio_id=portfolio_id,
                    ticker=ticker,
                    change_type="added",
                    target_pct=new_pct,
                    old_target_pct=None,
                    changed_by_id=changed_by_id,
                ))
            elif abs(Decimal(str(old_map[ticker])) - new_pct) > Decimal("0.001"):
                self.session.add(PortfolioHoldingHistory(
                    portfolio_id=portfolio_id,
                    ticker=ticker,
                    change_type="changed",
                    target_pct=new_pct,
                    old_target_pct=old_map[ticker],
                    changed_by_id=changed_by_id,
                ))

        for ticker, old_pct in old_map.items():
            if ticker not in new_map:
                self.session.add(PortfolioHoldingHistory(
                    portfolio_id=portfolio_id,
                    ticker=ticker,
                    change_type="removed",
                    target_pct=old_pct,
                    old_target_pct=None,
                    changed_by_id=changed_by_id,
                ))

        await self.session.flush()

    async def find_holding_history(self, portfolio_id: int, limit: int = 50) -> list[PortfolioHoldingHistory]:
        result = await self.session.execute(
            select(PortfolioHoldingHistory)
            .where(PortfolioHoldingHistory.portfolio_id == portfolio_id)
            .order_by(PortfolioHoldingHistory.changed_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

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
        result = await self.session.execute(
            select(UserPortfolio.user_id).where(
                UserPortfolio.portfolio_id == portfolio_id,
                UserPortfolio.left_at.is_(None),
            )
        )
        return list(result.scalars().all())

    async def insert_user_portfolio(self, user_id: int, portfolio_id: int) -> UserPortfolio:
        up = UserPortfolio(user_id=user_id, portfolio_id=portfolio_id)
        self.session.add(up)
        await self.session.flush()
        return up

    async def update_portfolio(self, portfolio_id: int, **kwargs) -> Portfolio | None:
        await self.session.execute(
            update(Portfolio).where(Portfolio.id == portfolio_id).values(**kwargs)
        )
        await self.session.flush()
        return await self.find_by_id(portfolio_id)

    async def set_user_portfolio_left_at(self, user_id: int, portfolio_id: int) -> None:
        await self.session.execute(
            update(UserPortfolio)
            .where(
                UserPortfolio.user_id == user_id,
                UserPortfolio.portfolio_id == portfolio_id,
                UserPortfolio.left_at.is_(None),
            )
            .values(left_at=datetime.now(timezone.utc))
        )
        await self.session.flush()

    async def find_user_counts(self, portfolio_ids: list[int]) -> dict[int, int]:
        if not portfolio_ids:
            return {}
        result = await self.session.execute(
            select(UserPortfolio.portfolio_id, func.count(UserPortfolio.id).label("cnt"))
            .where(
                UserPortfolio.portfolio_id.in_(portfolio_ids),
                UserPortfolio.left_at.is_(None),
            )
            .group_by(UserPortfolio.portfolio_id)
        )
        return {row.portfolio_id: row.cnt for row in result}
