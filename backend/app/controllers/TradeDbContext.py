from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.models.TradeModel import Trade, TradeStatus


class TradeDbContext:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_user_trades(self, user_id: int, page: int, page_size: int, **filters) -> tuple[list[Trade], int]:
        # Return paginated trades for the given user_id with optional filters applied.
        # Filters may include: ticker, action, status, created_after, created_before.
        # Return (rows, total_count) tuple for pagination metadata.
        pass

    async def insert_trade(self, user_id: int, rebalance_event_id: int | None, brokerage_connection_id: int | None, ticker: str, action: str, quantity, price=None) -> Trade:
        # Insert a new Trade row with status = "pending" and return the flushed object.
        # All monetary values (quantity, price) must be passed as decimal.Decimal — never float.
        pass

    async def update_trade_status(self, trade_id: int, status: TradeStatus, broker_order_id: str | None = None, price=None, executed_at: datetime | None = None, error_message: str | None = None) -> None:
        # UPDATE the trade row with execution results from the brokerage API response.
        # Set executed_at when status transitions to "filled" or "cancelled".
        # Preserve error_message for failed trades so admins can diagnose via error_logs.
        pass
