from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.helper.Database import get_session
from app.middleware.AuthMiddleware import get_current_user
from app.models.TradeModel import TradeAction, TradeStatus
from app.schemas.Trade import TradeHistoryResponse
from app.services.TradeService import TradeService

router = APIRouter(prefix="/trades", tags=["trades"])


@router.get("/history", response_model=TradeHistoryResponse)
async def get_my_trades(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    ticker: str | None = Query(None),
    action: TradeAction | None = Query(None),
    status: TradeStatus | None = Query(None),
    created_after: datetime | None = Query(None),
    created_before: datetime | None = Query(None),
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    filters = {
        k: v for k, v in {
            "ticker": ticker,
            "action": action,
            "status": status,
            "created_after": created_after,
            "created_before": created_before,
        }.items() if v is not None
    }

    trades, total = await TradeService(session).get_history(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        **filters,
    )

    return TradeHistoryResponse(trades=trades, total=total, page=page, page_size=page_size)
