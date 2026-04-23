from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.models.BrokerageModel import BrokerageConnection


class BrokerageDbContext:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_by_user(self, user_id: int) -> list[BrokerageConnection]:
        # Return all active (is_active = True) brokerage connections for the given user_id.
        # Order by created_at DESC.
        pass

    async def find_by_id(self, connection_id: int) -> BrokerageConnection | None:
        # Return a single BrokerageConnection by primary key, or None if not found / inactive.
        pass

    async def insert(self, user_id: int, brokerage_slug: str, access_token_enc: str, refresh_token_enc: str | None, token_expires_at: datetime | None, account_id: str | None) -> BrokerageConnection:
        # Insert a new BrokerageConnection row with encrypted token values.
        # Flush and return the new ORM object.
        pass

    async def update_tokens(self, connection_id: int, access_token_enc: str, refresh_token_enc: str | None, token_expires_at: datetime | None) -> None:
        # UPDATE the encrypted token columns and token_expires_at for the given connection.
        # Called by the token refresh job and the OAuth callback handler.
        pass

    async def deactivate(self, connection_id: int) -> None:
        # Set is_active = False on the given connection row.
        # Does not delete the row — keeps the audit trail intact.
        pass
