from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.helper.Database import get_session
from app.middleware.AuthMiddleware import get_current_user
from app.schemas.Trade import TradeHistoryResponse

router = APIRouter(prefix="/trades", tags=["trades"])


@router.get("/history", response_model=TradeHistoryResponse)
async def get_my_trades(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Return paginated trade history for the authenticated user via TradeService.
    # Support optional query param filters: ticker, action (buy/sell), status, date_range.
    # Include total count for frontend pagination metadata.
    pass
