from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime
from app.models.TradeModel import Trade, TradeStatus


class TradeDbContext:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_user_trades(self, user_id: int, page: int, page_size: int, **filters) -> tuple[list[Trade], int]:
        conditions = [Trade.user_id == user_id]

        if ticker := filters.get("ticker"):
            conditions.append(Trade.ticker == ticker.upper())

        if action := filters.get("action"):
            conditions.append(Trade.action == action)

        if status := filters.get("status"):
            conditions.append(Trade.status == status)

        if created_after := filters.get("created_after"):
            conditions.append(Trade.created_at >= created_after)

        if created_before := filters.get("created_before"):
            conditions.append(Trade.created_at <= created_before)

        where_clause = and_(*conditions)

        count_result = await self.session.execute(
            select(func.count()).select_from(Trade).where(where_clause)
        )
        total = count_result.scalar_one()

        rows_result = await self.session.execute(
            select(Trade)
            .where(where_clause)
            .order_by(Trade.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        return list(rows_result.scalars().all()), total

    async def insert_trade(self, user_id: int, rebalance_event_id: int | None, brokerage_connection_id: int | None, ticker: str, action: str, quantity, price=None) -> Trade:
        """Insert a new Trade row with status=pending and return the flushed object.

        quantity is stored as a notional USD amount (e.g. 200.00 for $200 invested).
        All monetary values must be passed as decimal.Decimal — never float.
        """
        from app.models.TradeModel import TradeAction, TradeStatus
        trade = Trade(
            user_id=user_id,
            rebalance_event_id=rebalance_event_id,
            brokerage_connection_id=brokerage_connection_id,
            ticker=ticker,
            action=TradeAction(action),
            quantity=quantity,
            price=price,
            status=TradeStatus.pending,
        )
        self.session.add(trade)
        await self.session.flush()
        return trade

    async def update_trade_status(self, trade_id: int, status: TradeStatus, broker_order_id: str | None = None, price=None, executed_at: datetime | None = None, error_message: str | None = None) -> None:
        # UPDATE the trade row with execution results from the brokerage API response.
        # Set executed_at when status transitions to "filled" or "cancelled".
        # Preserve error_message for failed trades so admins can diagnose via error_logs.
        pass
