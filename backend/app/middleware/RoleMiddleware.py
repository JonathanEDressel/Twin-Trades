from fastapi import Depends
from app.middleware.AuthMiddleware import get_current_user
from app.helper.ErrorHandler import ForbiddenError
from typing import Callable


def require_role(*roles: str) -> Callable:
    # Return a FastAPI dependency that checks current_user.role is in the allowed roles list.
    # Raise ForbiddenError immediately if the role is not permitted — this is the first of two gates.
    # Services perform a second independent role check; both must pass for destructive operations.
    pass
