from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.helper.Database import get_session
from app.middleware.AuthMiddleware import get_current_user
from app.middleware.RateLimiters import api_limiter
from app.schemas.Portfolio import PortfolioResponse, JoinPortfolioPayload, MarketplaceResponse
from app.services.PortfolioService import PortfolioService

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


@router.get("/marketplace", response_model=MarketplaceResponse)
async def list_marketplace(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await PortfolioService(session).list_marketplace(current_user, page, page_size)


@router.get("/mine", response_model=list[PortfolioResponse])
async def get_my_portfolios(current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    return await PortfolioService(session).get_my_portfolios(current_user.id)


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio_detail(portfolio_id: int, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    return await PortfolioService(session).get_detail(portfolio_id, current_user.id)


@router.post("/join")
async def join_portfolio(body: JoinPortfolioPayload, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    result = await PortfolioService(session).join(
        current_user,
        body.portfolio_id,
        investment_amount=body.investment_amount,
        brokerage_connection_id=body.brokerage_connection_id,
    )
    return {"message": "Joined portfolio", "trades_queued": result["trades_queued"]}


@router.delete("/{portfolio_id}/leave")
async def leave_portfolio(portfolio_id: int, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    await PortfolioService(session).leave(current_user.id, portfolio_id)
    return {"message": "Left portfolio"}
