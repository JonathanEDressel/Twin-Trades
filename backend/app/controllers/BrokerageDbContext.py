from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc
from datetime import datetime
from app.models.BrokerageModel import BrokerageConnection


class BrokerageDbContext:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_by_user(self, user_id: int) -> list[BrokerageConnection]:
        result = await self.session.execute(
            select(BrokerageConnection)
            .where(BrokerageConnection.user_id == user_id, BrokerageConnection.is_active == True)
            .order_by(desc(BrokerageConnection.created_at))
        )
        return list(result.scalars().all())

    async def find_by_id(self, connection_id: int) -> BrokerageConnection | None:
        result = await self.session.execute(
            select(BrokerageConnection)
            .where(BrokerageConnection.id == connection_id, BrokerageConnection.is_active == True)
        )
        return result.scalar_one_or_none()

    async def insert(self, user_id: int, brokerage_slug: str, access_token_enc: str, refresh_token_enc: str | None, token_expires_at: datetime | None, account_id: str | None) -> BrokerageConnection:
        conn = BrokerageConnection(
            user_id=user_id,
            brokerage_slug=brokerage_slug,
            access_token_enc=access_token_enc,
            refresh_token_enc=refresh_token_enc,
            token_expires_at=token_expires_at,
            account_id=account_id,
        )
        self.session.add(conn)
        await self.session.flush()
        return conn

    async def update_tokens(self, connection_id: int, access_token_enc: str, refresh_token_enc: str | None, token_expires_at: datetime | None) -> None:
        values: dict = {"access_token_enc": access_token_enc}
        if refresh_token_enc is not None:
            values["refresh_token_enc"] = refresh_token_enc
        if token_expires_at is not None:
            values["token_expires_at"] = token_expires_at
        await self.session.execute(
            update(BrokerageConnection)
            .where(BrokerageConnection.id == connection_id)
            .values(**values)
        )

    async def deactivate(self, connection_id: int) -> None:
        await self.session.execute(
            update(BrokerageConnection)
            .where(BrokerageConnection.id == connection_id)
            .values(is_active=False)
        )
