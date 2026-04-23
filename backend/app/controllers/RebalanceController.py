from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.helper.Database import get_session
from app.middleware.AuthMiddleware import get_current_user
from app.schemas.Rebalance import PendingRebalanceResponse, ConfirmRebalanceResponse

router = APIRouter(prefix="/rebalances", tags=["rebalances"])


@router.get("/pending", response_model=list[PendingRebalanceResponse])
async def list_pending(current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Return all non-expired rebalance events awaiting this user's confirmation.
    # Include the holding snapshot for each event so the iOS app can display the proposed allocation.
    # Filter out events where expires_at has passed — those are handled by the expiry cron job.
    pass


@router.post("/{event_id}/confirm", response_model=ConfirmRebalanceResponse)
async def confirm(event_id: int, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Mark the rebalance event as confirmed and queue trade execution via RebalanceService.confirm.
    # Validate that the event belongs to a portfolio the user is still enrolled in.
    # Raise NotFoundError if the event_id is not pending or is expired.
    pass


@router.post("/{event_id}/reject", response_model=ConfirmRebalanceResponse)
async def reject(event_id: int, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Mark the rebalance event as rejected for this user and skip their trade execution.
    # The event remains visible to other users who have not yet responded.
    # Log the rejection with user_id and event_id for admin audit purposes.
    pass
