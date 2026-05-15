from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.helper.Database import get_session
from app.helper.Security import Security
from app.helper.ErrorHandler import UnauthorizedError, ForbiddenError

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
):
    claims = Security.verify_jwt(credentials.credentials)

    if claims.get("scope") == "change_password_only":
        raise ForbiddenError("Token is restricted to password change only")

    user_id = int(claims["sub"])
    from app.controllers.UserDbContext import UserDbContext
    user = await UserDbContext(session).find_by_id(user_id)
    if user is None:
        raise UnauthorizedError("User not found or has been deleted")

    return user


async def get_current_user_any_scope(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
):
    """Like get_current_user but also accepts change_password_only scoped tokens."""
    claims = Security.verify_jwt(credentials.credentials)
    user_id = int(claims["sub"])
    from app.controllers.UserDbContext import UserDbContext
    user = await UserDbContext(session).find_by_id(user_id)
    if user is None:
        raise UnauthorizedError("User not found or has been deleted")
    return user
