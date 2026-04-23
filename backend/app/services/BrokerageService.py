from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.BrokerageDbContext import BrokerageDbContext
from app.brokerages.Factory import BrokerageFactory
from app.helper.Security import Security
from app.models.BrokerageModel import BrokerageConnection


class BrokerageService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.brokerage_db = BrokerageDbContext(session)

    async def list_connections(self, user_id: int) -> list[BrokerageConnection]:
        # Return all active brokerage connections for the user via BrokerageDbContext.find_by_user.
        # Do not decrypt tokens — return only metadata fields safe for client consumption.
        pass

    async def initiate_oauth(self, user_id: int, brokerage_slug: str) -> dict:
        # Retrieve the adapter for brokerage_slug via BrokerageFactory; raise BadRequestError if unknown.
        # Generate a CSRF state token, store it temporarily, and return the authorization URL.
        # Return a dict with keys: auth_url (str), state (str).
        pass

    async def handle_oauth_callback(self, user_id: int, brokerage_slug: str, code: str, state: str) -> BrokerageConnection:
        # Validate the state token matches the one stored during initiation.
        # Exchange the authorization code for access+refresh tokens via the adapter.
        # Encrypt both tokens with Security.encrypt_brokerage_token and save via BrokerageDbContext.insert.
        pass

    async def disconnect(self, user_id: int, connection_id: int) -> None:
        # Verify the connection belongs to the user; raise NotFoundError otherwise.
        # Call the adapter's revoke_token method to invalidate tokens at the brokerage.
        # Deactivate the connection row via BrokerageDbContext.deactivate.
        pass

    async def refresh_expiring_tokens(self) -> int:
        # Query all connections where token_expires_at < now() + 1 hour and is_active = True.
        # For each, call the adapter's refresh_token method and update the stored encrypted tokens.
        # Return count of successfully refreshed connections for logging by the cron job.
        pass
