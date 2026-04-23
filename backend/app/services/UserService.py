from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.UserDbContext import UserDbContext
from app.controllers.AuthDbContext import AuthDbContext
from app.models.UserModel import User


class UserService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_db = UserDbContext(session)
        self.auth_db = AuthDbContext(session)

    async def get_by_id(self, user_id: int) -> User:
        # Fetch the user by primary key via UserDbContext.find_by_id.
        # Raise NotFoundError if the user does not exist or has been soft-deleted.
        pass

    async def update_self(self, user_id: int, **kwargs) -> User:
        # Apply partial field updates to the authenticated user's own row.
        # Validate avatar_url format if provided; strip dangerous fields like role.
        # Return the updated User ORM object.
        pass

    async def delete_self(self, user_id: int) -> None:
        # Soft-delete the user by setting deleted_at = now() and is_active = False.
        # Revoke all refresh tokens via AuthDbContext.revoke_all_refresh_tokens.
        # Cascade: deactivate all brokerage connections and cancel pending rebalances.
        pass
