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
    # Verify the Bearer JWT using Security.verify_jwt and look up the user by the sub claim.
    # Reject tokens whose scope == "change_password_only" — those are only valid on /auth/change-password.
    # Raise UnauthorizedError if the token is expired, invalid, or the user row no longer exists.
    pass
