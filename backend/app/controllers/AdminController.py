from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.helper.Database import get_session
from app.middleware.AuthMiddleware import get_current_user
from app.middleware.RoleMiddleware import require_role
from app.middleware.RateLimiters import admin_limiter
from app.schemas.User import UserResponse, UserUpdatePayload
from app.schemas.Portfolio import PortfolioResponse, CreatePortfolioPayload, UpdateHoldingsPayload
from app.schemas.ChangeLog import ChangeLogEntryResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(require_role("admin")),
    session: AsyncSession = Depends(get_session)
):
    # Return paginated list of all users (including soft-deleted) via AdminService.
    # Support optional query param filters: role, is_active, subscription_status.
    # Admins see all fields including created_at, deleted_at, and subscription_exempt.
    pass


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    body: UserUpdatePayload,
    current_user=Depends(require_role("admin")),
    session: AsyncSession = Depends(get_session)
):
    # Apply admin field updates to any user — including role, subscription_exempt, is_active.
    # Log the change to change_log via ChangeLogService.record with the admin's user_id.
    # Raise NotFoundError if user_id does not exist.
    pass


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user=Depends(require_role("admin")),
    session: AsyncSession = Depends(get_session)
):
    # Soft-delete the target user and revoke all their refresh tokens immediately.
    # Prevent deletion of the last admin account — raise BadRequestError if attempted.
    # Log the deletion to change_log with the admin actor_id.
    pass


@router.post("/portfolios", response_model=PortfolioResponse)
async def create_portfolio(
    body: CreatePortfolioPayload,
    current_user=Depends(require_role("admin")),
    session: AsyncSession = Depends(get_session)
):
    # Create a new portfolio with the admin as created_by_id.
    # Initially has no holdings — use PUT /admin/portfolios/{id}/holdings to add them.
    # Log the creation event to change_log.
    pass


@router.patch("/portfolios/{portfolio_id}", response_model=PortfolioResponse)
async def update_portfolio(
    portfolio_id: int,
    body: CreatePortfolioPayload,
    current_user=Depends(require_role("admin")),
    session: AsyncSession = Depends(get_session)
):
    # Update portfolio name and/or description; does not change holdings.
    # Raise NotFoundError if portfolio_id does not exist.
    # Log the update to change_log.
    pass


@router.delete("/portfolios/{portfolio_id}")
async def delete_portfolio(
    portfolio_id: int,
    current_user=Depends(require_role("admin")),
    session: AsyncSession = Depends(get_session)
):
    # Hard-delete the portfolio and cascade-delete all holdings and user_portfolios rows.
    # Cancel any pending rebalance events for this portfolio before deleting.
    # Log the deletion to change_log.
    pass


@router.put("/portfolios/{portfolio_id}/holdings")
async def update_holdings(
    portfolio_id: int,
    body: UpdateHoldingsPayload,
    current_user=Depends(require_role("admin")),
    session: AsyncSession = Depends(get_session)
):
    # Replace all holdings for the portfolio atomically: delete old rows, insert new ones.
    # Validate that target_pct values sum to exactly 100.00 before writing.
    # Trigger a rebalance event for all users subscribed to this portfolio after saving.
    pass


@router.patch("/portfolios/{portfolio_id}/toggle-active")
async def toggle_portfolio_active(
    portfolio_id: int,
    current_user=Depends(require_role("admin")),
    session: AsyncSession = Depends(get_session)
):
    # Flip the is_active boolean on the portfolio; deactivated portfolios are hidden from marketplace.
    # Log the toggle action to change_log with before/after state.
    pass


@router.delete("/portfolios/{portfolio_id}/users/{user_id}")
async def remove_user_from_portfolio(
    portfolio_id: int,
    user_id: int,
    current_user=Depends(require_role("admin")),
    session: AsyncSession = Depends(get_session)
):
    # Set left_at = now() on the user_portfolios row matching both IDs.
    # Raise NotFoundError if the user is not currently a member of the portfolio.
    # Log the removal to change_log.
    pass


@router.get("/error-logs")
async def list_error_logs(
    page: int = Query(1, ge=1),
    current_user=Depends(require_role("admin")),
    session: AsyncSession = Depends(get_session)
):
    # Return paginated server error logs from error_logs table via AdminDbContext.
    # Support optional date-range and severity filters via query params.
    pass


@router.get("/revenue")
async def get_revenue(
    current_user=Depends(require_role("admin")),
    session: AsyncSession = Depends(get_session)
):
    # Aggregate subscription revenue by plan and period from the subscriptions table.
    # Return MRR, ARR, and one-time lifetime revenue as separate keys in the response.
    pass


@router.get("/change-log", response_model=list[ChangeLogEntryResponse])
async def get_change_log(
    page: int = Query(1, ge=1),
    current_user=Depends(require_role("admin")),
    session: AsyncSession = Depends(get_session)
):
    # Return paginated change_log entries ordered by created_at DESC.
    # The change_log is INSERT-ONLY — this endpoint is read-only and never mutates.
    pass
