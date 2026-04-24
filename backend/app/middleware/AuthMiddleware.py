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
        raise UnauthorizedError("Token is restricted to password change only")

    user_id = int(claims["sub"])
    from app.controllers.UserDbContext import UserDbContext
    user = await UserDbContext(session).find_by_id(user_id)
    if user is None:
        raise UnauthorizedError("User not found or has been deleted")

    return user
