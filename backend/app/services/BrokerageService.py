from datetime import datetime, timedelta, timezone
import secrets
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.controllers.BrokerageDbContext import BrokerageDbContext
from app.brokerages.Factory import BrokerageFactory
from app.helper.Security import Security
from app.helper.ErrorHandler import NotFoundError, ForbiddenError, BadRequestError, UnauthorizedError
from app.helper.Logger import logger
from app.models.BrokerageModel import BrokerageConnection


class BrokerageService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.brokerage_db = BrokerageDbContext(session)

    async def list_connections(self, user_id: int) -> list[BrokerageConnection]:
        return await self.brokerage_db.find_by_user(user_id)

    async def initiate_oauth(self, user_id: int, brokerage_slug: str) -> dict:
        adapter = BrokerageFactory.get(brokerage_slug)
        # Encode user_id + slug in a short-lived signed JWT used as the OAuth state for CSRF protection
        state = Security.sign_jwt(
            {"sub": str(user_id), "slug": brokerage_slug},
            expires_in=timedelta(minutes=30),
        )
        auth_url = adapter.get_auth_url(state)
        return {"auth_url": auth_url, "state": state}

    async def handle_oauth_callback(self, user_id: int, brokerage_slug: str, code: str, state: str) -> BrokerageConnection:
        # Validate the state JWT
        try:
            claims = Security.verify_jwt(state)
        except Exception:
            raise BadRequestError("Invalid or expired OAuth state")
        if str(claims.get("sub")) != str(user_id):
            raise BadRequestError("OAuth state user mismatch")
        if claims.get("slug") != brokerage_slug:
            raise BadRequestError("OAuth state brokerage mismatch")

        adapter = BrokerageFactory.get(brokerage_slug)
        token_data = await adapter.exchange_code(code)

        access_token_enc = Security.encrypt_brokerage_token(token_data["access_token"])
        refresh_token_enc = (
            Security.encrypt_brokerage_token(token_data["refresh_token"])
            if token_data.get("refresh_token")
            else None
        )
        expires_at = (
            datetime.now(timezone.utc) + timedelta(seconds=token_data["expires_in"])
            if token_data.get("expires_in")
            else None
        )

        conn = await self.brokerage_db.insert(
            user_id=user_id,
            brokerage_slug=brokerage_slug,
            access_token_enc=access_token_enc,
            refresh_token_enc=refresh_token_enc,
            token_expires_at=expires_at,
            account_id=token_data.get("account_id"),
        )
        await self.session.commit()
        return conn

    async def disconnect(self, user_id: int, connection_id: int) -> None:
        connection = await self.brokerage_db.find_by_id(connection_id)
        if connection is None:
            raise NotFoundError("Brokerage connection not found")
        if connection.user_id != user_id:
            raise ForbiddenError("You do not own this connection")
        try:
            adapter = BrokerageFactory.get(connection.brokerage_slug)
            await adapter.revoke_token(connection.access_token_enc)
        except Exception as e:
            logger.warning(f"Token revocation failed for connection {connection_id}: {e}")
        await self.brokerage_db.deactivate(connection_id)
        await self.session.commit()

    async def refresh_expiring_tokens(self) -> int:
        threshold = datetime.now(timezone.utc) + timedelta(hours=1)
        result = await self.session.execute(
            select(BrokerageConnection).where(
                BrokerageConnection.is_active == True,
                BrokerageConnection.token_expires_at <= threshold,
                BrokerageConnection.refresh_token_enc.is_not(None),
            )
        )
        connections = list(result.scalars().all())
        refreshed = 0
        for conn in connections:
            try:
                adapter = BrokerageFactory.get(conn.brokerage_slug)
                token_data = await adapter.refresh_token(conn.refresh_token_enc)
                new_access_enc = Security.encrypt_brokerage_token(token_data["access_token"])
                new_refresh_enc = (
                    Security.encrypt_brokerage_token(token_data["refresh_token"])
                    if token_data.get("refresh_token")
                    else None
                )
                new_expires_at = (
                    datetime.now(timezone.utc) + timedelta(seconds=token_data["expires_in"])
                    if token_data.get("expires_in")
                    else None
                )
                await self.brokerage_db.update_tokens(conn.id, new_access_enc, new_refresh_enc, new_expires_at)
                refreshed += 1
            except Exception as e:
                logger.warning(f"Failed to refresh tokens for connection {conn.id}: {e}")
        await self.session.commit()
        return refreshed
