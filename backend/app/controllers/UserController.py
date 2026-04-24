from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.helper.Database import get_session
from app.middleware.AuthMiddleware import get_current_user
from app.middleware.RateLimiters import api_limiter
from app.schemas.User import UserResponse, UserUpdatePayload
from app.services.UserService import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    return await UserService(session).get_by_id(current_user.id)


@router.patch("/me", response_model=UserResponse)
async def update_me(body: UserUpdatePayload, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Apply the partial update fields from the payload to the current user's row.
    # Validate that avatar_url, if supplied, is an https:// URL before saving.
    # Return the updated UserResponse with the new field values reflected.
    return await UserService(session).update_self(current_user.id, body)


@router.delete("/me")
async def delete_me(current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Soft-delete the authenticated user by setting deleted_at = now() and is_active = False.
    # Revoke all refresh tokens so all active sessions are immediately invalidated.
    # Trigger async cleanup of brokerage connections and pending rebalances for this user.
    await UserService(session).delete_self(current_user.id)
    return {"message": "Account deleted successfully"}
