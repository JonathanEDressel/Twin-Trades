from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.helper.Database import get_session
from app.middleware.AuthMiddleware import get_current_user
from app.schemas.Rebalance import PendingRebalanceResponse, ConfirmRebalanceResponse
from app.services.RebalanceService import RebalanceService

router = APIRouter(prefix="/rebalances", tags=["rebalances"])


@router.get("/pending", response_model=list[PendingRebalanceResponse])
async def list_pending(current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    return await RebalanceService(session).list_pending(current_user.id)


@router.post("/{event_id}/confirm", response_model=ConfirmRebalanceResponse)
async def confirm(event_id: int, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    return await RebalanceService(session).confirm(event_id, current_user.id)


@router.post("/{event_id}/reject", response_model=ConfirmRebalanceResponse)
async def reject(event_id: int, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    return await RebalanceService(session).reject(event_id, current_user.id)
