from fastapi import Depends
from app.middleware.AuthMiddleware import get_current_user
from app.helper.ErrorHandler import ForbiddenError
from typing import Callable


def require_role(*roles: str) -> Callable:
    async def dependency(current_user=Depends(get_current_user)):
        if current_user.role.value not in roles:
            raise ForbiddenError(f"Requires role: {', '.join(roles)}")
        return current_user
    return dependency
