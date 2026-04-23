from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.helper.Database import get_session
from app.middleware.AuthMiddleware import get_current_user
from app.middleware.RateLimiters import api_limiter
from app.schemas.Portfolio import PortfolioResponse, JoinPortfolioPayload

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


@router.get("/marketplace", response_model=list[PortfolioResponse])
async def list_marketplace(current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Return all active portfolios with their current holdings via PortfolioService.list_marketplace.
    # Exclude portfolios the user is already subscribed to from the result set.
    # Subscription gate: user must have an active subscription or subscription_exempt = True.
    pass


@router.get("/mine", response_model=list[PortfolioResponse])
async def get_my_portfolios(current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Return all portfolios the authenticated user is actively following (left_at IS NULL).
    # Include holdings and total_return_pct for each portfolio.
    # Return empty list (not 404) if the user has no portfolios.
    pass


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio_detail(portfolio_id: int, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Return full detail for a single portfolio including all current holdings.
    # Raise NotFoundError if the portfolio does not exist or is not active.
    # Any authenticated user may view details — subscription gate only on marketplace listing.
    pass


@router.post("/join")
async def join_portfolio(body: JoinPortfolioPayload, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Enroll the authenticated user into the given portfolio via PortfolioService.join.
    # Verify the user has an active subscription before allowing them to join.
    # Raise ConflictError if the user is already a member of the portfolio.
    pass


@router.delete("/{portfolio_id}/leave")
async def leave_portfolio(portfolio_id: int, current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    # Set left_at = now() on the user_portfolios row to unfollow the portfolio.
    # Cancel any pending rebalance confirmations for this user+portfolio combination.
    # Raise NotFoundError if the user is not currently a member.
    pass
