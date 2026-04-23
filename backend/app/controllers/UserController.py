from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.helper.Database import get_session
from app.middleware.AuthMiddleware import get_current_user
from app.middleware.RateLimiters import api_limiter
from app.schemas.User import UserResponse, UserUpdatePayload

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    # Return the authenticated user's profile via UserService.get_by_id.
    # Strip password_hash, device tokens, and other sensitive fields before returning.
    # Raise UnauthorizedError if the JWT is invalid or the user row has been soft-deleted.
    pass


@router.patch("/me", response_model=UserResponse)
async def update_me(body: UserUpdatePayload, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Apply the partial update fields from the payload to the current user's row.
    # Validate that avatar_url, if supplied, is an https:// URL before saving.
    # Return the updated UserResponse with the new field values reflected.
    pass


@router.delete("/me")
async def delete_me(current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Soft-delete the authenticated user by setting deleted_at = now() and is_active = False.
    # Revoke all refresh tokens so all active sessions are immediately invalidated.
    # Trigger async cleanup of brokerage connections and pending rebalances for this user.
    pass
