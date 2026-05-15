from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.UserModel import User


class UserDbContext:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_by_id(self, user_id: int) -> User | None:
        result = await self.session.execute(
            select(User).where(
                User.id == user_id,
                User.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def find_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(
                User.email == email.lower(),
                User.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def find_by_username(self, username: str) -> User | None:
        result = await self.session.execute(
            select(User).where(
                User.username == username,
                User.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()  

    async def insert(self, **kwargs) -> User:
        user = User(**kwargs)
        self.session.add(user)
        await self.session.flush()
        return user

    async def update_by_id(self, user_id: int, **kwargs) -> User | None:
        result = await self.session.execute(
            select(User).where(
                User.id == user_id,
                User.deleted_at.is_(None),
            )
        )
        user = result.scalar_one_or_none()
        if user is None:
            return None
        for key, value in kwargs.items():
            setattr(user, key, value)
        await self.session.flush()
        return user

    async def update_device_tokens(self, user_id: int, apns_device_token: str) -> None:
        await self.session.execute(
            update(User)
            .where(User.id == user_id, User.deleted_at.is_(None))
            .values(apns_device_token=apns_device_token)
        )
