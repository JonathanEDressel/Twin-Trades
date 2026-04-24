from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.UserDbContext import UserDbContext
from app.controllers.AuthDbContext import AuthDbContext
from app.models.UserModel import User
from app.schemas.User import UserUpdatePayload
from app.helper.ErrorHandler import NotFoundError, BadRequestError

class UserService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_db = UserDbContext(session)
        self.auth_db = AuthDbContext(session)

    async def get_by_id(self, user_id: int) -> User:
        user = await self.user_db.find_by_id(user_id)
        if user is None:
            raise NotFoundError("User not found")
        return user

    async def update_self(self, user_id: int, payload: UserUpdatePayload) -> User:
        if payload.avatar_url is not None and not payload.avatar_url.startswith("https://"):
            raise BadRequestError("avatar_url must be an https:// URL")

        updates = payload.model_dump(exclude_none=True)
        user = await self.user_db.update_by_id(user_id, **updates)
        if user is None:
            raise NotFoundError("User not found")

        await self.session.commit()
        return user

    async def delete_self(self, user_id: int) -> None:
        await self.user_db.update_by_id(
            user_id,
            deleted_at=datetime.now(timezone.utc),
            is_active=False,
        )
        await self.auth_db.revoke_all_refresh_tokens(user_id)
        await self.session.commit()
