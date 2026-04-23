from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.TradeDbContext import TradeDbContext
from app.controllers.BrokerageDbContext import BrokerageDbContext
from app.controllers.PortfolioDbContext import PortfolioDbContext


class TradeService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.trade_db = TradeDbContext(session)
        self.brokerage_db = BrokerageDbContext(session)
        self.portfolio_db = PortfolioDbContext(session)

    async def execute_rebalance(self, event_id: int, user_id: int) -> None:
        # Fetch the user's active brokerage connection and decrypt tokens via Security.decrypt_brokerage_token.
        # Compute delta trades (buy/sell) needed to reach the target allocation and submit each via the adapter.
        # Update each Trade row to "filled" or "failed" based on the brokerage API response.
        pass

    async def execute_initial_buy(self, user_id: int, portfolio_id: int) -> None:
        # Called after a user joins a portfolio — buy the target allocations from scratch.
        # Fetch the user's brokerage connection and submit buy orders proportional to target_pct.
        # Insert Trade rows for each order and update status after the brokerage responds.
        pass

    async def execute_full_sell(self, user_id: int, portfolio_id: int) -> None:
        # Called when a user leaves a portfolio — liquidate all positions held for this portfolio.
        # Fetch current positions from the brokerage adapter and submit a market sell for each ticker.
        # Insert Trade rows for each sell order and update status after execution.
        pass
