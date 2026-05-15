from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.helper.Database import get_session
from app.middleware.RoleMiddleware import require_role
from app.middleware.RateLimiters import admin_limiter
from app.schemas.User import UserResponse, AdminUserUpdatePayload, PaginatedUsersResponse, AdminUserResponse
from app.schemas.Portfolio import (
    AdminPortfolioResponse, CreatePortfolioPayload, UpdatePortfolioPayload,
    UpdateHoldingsPayload, PaginatedAdminPortfoliosResponse,
)
from app.schemas.ChangeLog import ChangeLogEntryResponse
from app.services.AdminService import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=PaginatedUsersResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, max_length=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    current_user=Depends(require_role("admin", "ultimate_admin")),
    session: AsyncSession = Depends(get_session)
):
    return await AdminService(session).list_users(page, page_size, search, sort_by, sort_order)


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    body: AdminUserUpdatePayload,
    current_user=Depends(require_role("admin", "ultimate_admin")),
    session: AsyncSession = Depends(get_session)
):
    return await AdminService(session).update_user(current_user.id, current_user.role.value, user_id, body)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user=Depends(require_role("ultimate_admin")),
    session: AsyncSession = Depends(get_session)
):
    await AdminService(session).delete_user(current_user.id, user_id)
    return {"message": "User deleted"}


@router.get("/portfolios", response_model=PaginatedAdminPortfoliosResponse)
async def list_portfolios(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(require_role("admin", "ultimate_admin")),
    session: AsyncSession = Depends(get_session)
):
    return await AdminService(session).list_portfolios(page, page_size)


@router.get("/portfolios/{portfolio_id}", response_model=AdminPortfolioResponse)
async def get_portfolio(
    portfolio_id: int,
    current_user=Depends(require_role("admin", "ultimate_admin")),
    session: AsyncSession = Depends(get_session)
):
    return await AdminService(session).get_portfolio(portfolio_id)


@router.post("/portfolios", response_model=AdminPortfolioResponse)
async def create_portfolio(
    body: CreatePortfolioPayload,
    current_user=Depends(require_role("admin", "ultimate_admin")),
    session: AsyncSession = Depends(get_session)
):
    return await AdminService(session).create_portfolio(current_user.id, body.name, body.description, body.icon_url)


@router.patch("/portfolios/{portfolio_id}", response_model=AdminPortfolioResponse)
async def update_portfolio(
    portfolio_id: int,
    body: UpdatePortfolioPayload,
    current_user=Depends(require_role("admin", "ultimate_admin")),
    session: AsyncSession = Depends(get_session)
):
    return await AdminService(session).update_portfolio(current_user.id, portfolio_id, body.name, body.description, body.icon_url)


@router.delete("/portfolios/{portfolio_id}")
async def delete_portfolio(
    portfolio_id: int,
    current_user=Depends(require_role("admin", "ultimate_admin")),
    session: AsyncSession = Depends(get_session)
):
    await AdminService(session).delete_portfolio(current_user.id, portfolio_id)
    return {"message": "Portfolio deleted"}


@router.put("/portfolios/{portfolio_id}/holdings", response_model=AdminPortfolioResponse)
async def update_holdings(
    portfolio_id: int,
    body: UpdateHoldingsPayload,
    current_user=Depends(require_role("admin", "ultimate_admin")),
    session: AsyncSession = Depends(get_session)
):
    return await AdminService(session).update_holdings(current_user.id, portfolio_id, body.holdings)


@router.patch("/portfolios/{portfolio_id}/toggle", response_model=AdminPortfolioResponse)
async def toggle_portfolio_active(
    portfolio_id: int,
    current_user=Depends(require_role("admin", "ultimate_admin")),
    session: AsyncSession = Depends(get_session)
):
    return await AdminService(session).toggle_portfolio_active(current_user.id, portfolio_id)


@router.delete("/portfolios/{portfolio_id}/users/{user_id}")
async def remove_user_from_portfolio(
    portfolio_id: int,
    user_id: int,
    current_user=Depends(require_role("admin", "ultimate_admin")),
    session: AsyncSession = Depends(get_session)
):
    await AdminService(session).remove_user_from_portfolio(current_user.id, portfolio_id, user_id)
    return {"message": "User removed from portfolio"}


@router.get("/logs")
async def list_error_logs(
    page: int = Query(1, ge=1),
    current_user=Depends(require_role("admin", "ultimate_admin")),
    session: AsyncSession = Depends(get_session)
):
    return await AdminService(session).get_error_logs(page, 50)


@router.get("/revenue")
async def get_revenue(
    current_user=Depends(require_role("admin", "ultimate_admin")),
    session: AsyncSession = Depends(get_session)
):
    return await AdminService(session).get_revenue()


@router.get("/changelog", response_model=list[ChangeLogEntryResponse])
async def get_change_log(
    page: int = Query(1, ge=1),
    current_user=Depends(require_role("admin", "ultimate_admin")),
    session: AsyncSession = Depends(get_session)
):
    result = await AdminService(session).get_change_log(page, 20)
    return result["entries"]
