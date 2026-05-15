from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.controllers.AdminDbContext import AdminDbContext
from app.controllers.UserDbContext import UserDbContext
from app.controllers.AuthDbContext import AuthDbContext
from app.controllers.PortfolioDbContext import PortfolioDbContext
from app.models.PortfolioModel import Portfolio, PortfolioHolding
from app.services.ChangeLogService import ChangeLogService
from app.schemas.User import AdminUserUpdatePayload, PaginatedUsersResponse
from app.schemas.Portfolio import (
    PortfolioResponse, PortfolioHoldingResponse, PortfolioHoldingHistoryResponse,
    AdminPortfolioResponse, PaginatedAdminPortfoliosResponse, PaginatedPortfoliosResponse,
)
from app.helper.ErrorHandler import NotFoundError, BadRequestError, ForbiddenError


class AdminService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.admin_db = AdminDbContext(session)
        self.user_db = UserDbContext(session)
        self.auth_db = AuthDbContext(session)
        self.portfolio_db = PortfolioDbContext(session)
        self.changelog = ChangeLogService(session)

    async def list_users(self, page: int, page_size: int, search: str | None = None, sort_by: str = "created_at", sort_order: str = "desc") -> PaginatedUsersResponse:
        from app.schemas.User import AdminUserResponse
        rows, total = await self.admin_db.find_all_users(page, page_size, search=search, sort_by=sort_by, sort_order=sort_order)
        users = [
            AdminUserResponse(
                id=row["user"].id,
                email=row["user"].email,
                username=row["user"].username,
                display_name=row["user"].display_name,
                avatar_url=row["user"].avatar_url,
                role=row["user"].role,
                is_active=row["user"].is_active,
                subscription_exempt=row["user"].subscription_exempt,
                created_at=row["user"].created_at,
                subscription_status=row["subscription_status"],
                subscription_plan=row["subscription_plan"],
                portfolio_count=row["portfolio_count"],
                invested_amount=row["invested_amount"],
            )
            for row in rows
        ]
        return PaginatedUsersResponse(users=users, total=total, page=page, page_size=page_size)

    async def update_user(self, actor_id: int, actor_role: str, user_id: int, payload: AdminUserUpdatePayload) -> object:
        from app.helper.Security import Security
        user = await self.user_db.find_by_id(user_id)
        if user is None:
            raise NotFoundError("User not found")
        if actor_role != "ultimate_admin" and user.role.value == "ultimate_admin":
            raise ForbiddenError("Admins cannot edit site admin accounts")
        if actor_role != "ultimate_admin" and payload.role is not None and payload.role.value == "ultimate_admin":
            raise ForbiddenError("Admins cannot assign the site admin role")
        updates = payload.model_dump(exclude_none=True)
        # Handle username uniqueness
        if "username" in updates:
            existing = await self.user_db.find_by_username(updates["username"])
            if existing and existing.id != user_id:
                raise BadRequestError("Username is already taken")
        # Handle email uniqueness (lowercase)
        if "email" in updates:
            updates["email"] = updates["email"].lower()
            existing = await self.user_db.find_by_email(updates["email"])
            if existing and existing.id != user_id:
                raise BadRequestError("Email is already in use")
        # Handle password — hash it and store as password_hash
        if "password" in updates:
            updates["password_hash"] = Security.hash_password(updates.pop("password"))
        updated = await self.user_db.update_by_id(user_id, **updates)
        await self.changelog.record(
            actor_id=actor_id,
            entity_type="user",
            entity_id=user_id,
            action="update",
            detail=str({k: v for k, v in updates.items() if k != "password_hash"}),
        )
        await self.session.commit()
        return updated

    async def delete_user(self, actor_id: int, user_id: int) -> None:
        user = await self.user_db.find_by_id(user_id)
        if user is None:
            raise NotFoundError("User not found")
        if user.role.value == "ultimate_admin":
            all_rows, _ = await self.admin_db.find_all_users(1, 10000)
            ua_count = sum(
                1 for row in all_rows
                if row["user"].role.value == "ultimate_admin" and row["user"].deleted_at is None
            )
            if ua_count <= 1:
                raise BadRequestError("Cannot delete the last site admin account")
        await self.user_db.update_by_id(
            user_id,
            deleted_at=datetime.now(timezone.utc),
            is_active=False,
        )
        await self.auth_db.revoke_all_refresh_tokens(user_id)
        await self.changelog.record(actor_id=actor_id, entity_type="user", entity_id=user_id, action="delete")
        await self.session.commit()

    async def _portfolio_response(
        self,
        p: Portfolio,
        user_count: int = 0,
        total_invested: str = "0.00",
    ) -> AdminPortfolioResponse:
        holdings = await self.portfolio_db.find_holdings(p.id)
        history = await self.portfolio_db.find_holding_history(p.id, limit=100)
        return AdminPortfolioResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            icon_url=p.icon_url,
            is_active=p.is_active,
            total_return_pct=p.total_return_pct,
            return_1w=p.return_1w,
            return_1m=p.return_1m,
            return_3m=p.return_3m,
            return_6m=p.return_6m,
            return_1y=p.return_1y,
            return_3y=p.return_3y,
            holdings=[PortfolioHoldingResponse.model_validate(h) for h in holdings],
            holding_history=[PortfolioHoldingHistoryResponse.model_validate(h) for h in history],
            user_count=user_count,
            total_invested=total_invested,
            created_at=p.created_at,
        )

    async def create_portfolio(self, actor_id: int, name: str, description: str | None, icon_url: str | None = None) -> AdminPortfolioResponse:
        portfolio = Portfolio(name=name, description=description, icon_url=icon_url, created_by_id=actor_id)
        self.session.add(portfolio)
        await self.session.flush()
        await self.changelog.record(actor_id=actor_id, entity_type="portfolio", entity_id=portfolio.id, action="create", detail=name)
        await self.session.commit()
        return await self._portfolio_response(portfolio)

    async def update_portfolio(self, actor_id: int, portfolio_id: int, name: str | None, description: str | None, icon_url: str | None = None) -> AdminPortfolioResponse:
        result = await self.session.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
        portfolio = result.scalar_one_or_none()
        if portfolio is None:
            raise NotFoundError("Portfolio not found")
        if name is not None:
            portfolio.name = name
        if description is not None:
            portfolio.description = description
        if icon_url is not None:
            portfolio.icon_url = icon_url
        await self.session.flush()
        await self.changelog.record(actor_id=actor_id, entity_type="portfolio", entity_id=portfolio_id, action="update")
        await self.session.commit()
        return await self._portfolio_response(portfolio)

    async def delete_portfolio(self, actor_id: int, portfolio_id: int) -> None:
        from sqlalchemy import delete as sa_delete, update as sa_update
        from app.models.PortfolioModel import UserPortfolio
        from app.models.TradeModel import RebalanceEvent, RebalanceEventStatus

        result = await self.session.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
        portfolio = result.scalar_one_or_none()
        if portfolio is None:
            raise NotFoundError("Portfolio not found")
        await self.session.execute(
            sa_update(RebalanceEvent)
            .where(RebalanceEvent.portfolio_id == portfolio_id, RebalanceEvent.status == RebalanceEventStatus.pending_confirmation)
            .values(status=RebalanceEventStatus.expired)
        )
        await self.session.execute(sa_delete(PortfolioHolding).where(PortfolioHolding.portfolio_id == portfolio_id))
        await self.session.execute(sa_delete(UserPortfolio).where(UserPortfolio.portfolio_id == portfolio_id))
        await self.session.execute(sa_delete(Portfolio).where(Portfolio.id == portfolio_id))
        await self.changelog.record(actor_id=actor_id, entity_type="portfolio", entity_id=portfolio_id, action="delete", detail=portfolio.name)
        await self.session.commit()

    async def update_holdings(self, actor_id: int, portfolio_id: int, holdings: list[dict]) -> AdminPortfolioResponse:
        total = sum(Decimal(str(h["target_pct"])) for h in holdings)
        if abs(total - Decimal("100")) > Decimal("0.01"):
            raise BadRequestError(f"Holdings must sum to 100.00, got {total}")
        result = await self.session.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
        portfolio = result.scalar_one_or_none()
        if portfolio is None:
            raise NotFoundError("Portfolio not found")
        old_holdings = await self.portfolio_db.find_holdings(portfolio_id)
        await self.portfolio_db.record_holding_history(portfolio_id, old_holdings, holdings, actor_id)
        await self.portfolio_db.replace_holdings(portfolio_id, holdings)
        await self.changelog.record(actor_id=actor_id, entity_type="portfolio", entity_id=portfolio_id, action="update_holdings")
        await self.session.commit()
        return await self._portfolio_response(portfolio)

    async def toggle_portfolio_active(self, actor_id: int, portfolio_id: int) -> AdminPortfolioResponse:
        result = await self.session.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
        portfolio = result.scalar_one_or_none()
        if portfolio is None:
            raise NotFoundError("Portfolio not found")
        portfolio.is_active = not portfolio.is_active
        await self.session.flush()
        await self.changelog.record(actor_id=actor_id, entity_type="portfolio", entity_id=portfolio_id, action="toggle", detail=f"is_active={portfolio.is_active}")
        await self.session.commit()
        return await self._portfolio_response(portfolio)

    async def remove_user_from_portfolio(self, actor_id: int, portfolio_id: int, user_id: int) -> None:
        existing = await self.portfolio_db.find_user_portfolio(user_id, portfolio_id)
        if existing is None:
            raise NotFoundError("User is not a member of this portfolio")
        await self.portfolio_db.set_user_portfolio_left_at(user_id, portfolio_id)
        await self.changelog.record(actor_id=actor_id, entity_type="user_portfolio", entity_id=portfolio_id, action="remove_user", detail=f"user_id={user_id}")
        await self.session.commit()

    async def list_portfolios(self, page: int, page_size: int) -> PaginatedAdminPortfoliosResponse:
        rows, total = await self.admin_db.find_all_portfolios(page, page_size)
        portfolios = [
            await self._portfolio_response(row["portfolio"], row["user_count"], row["total_invested"])
            for row in rows
        ]
        return PaginatedAdminPortfoliosResponse(portfolios=portfolios, total=total, page=page, page_size=page_size)

    async def get_portfolio(self, portfolio_id: int) -> AdminPortfolioResponse:
        result = await self.session.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
        portfolio = result.scalar_one_or_none()
        if portfolio is None:
            raise NotFoundError("Portfolio not found")
        stats = await self.admin_db.find_portfolio_stats(portfolio_id)
        return await self._portfolio_response(portfolio, stats["user_count"], stats["total_invested"])

    async def get_change_log(self, page: int, page_size: int) -> dict:
        entries, total = await self.admin_db.find_change_log(page, page_size)
        return {"entries": entries, "total": total, "page": page, "page_size": page_size}

    async def get_error_logs(self, page: int, page_size: int) -> dict:
        logs, total = await self.admin_db.find_error_logs(page, page_size)
        return {"logs": logs, "total": total, "page": page, "page_size": page_size}

    async def get_revenue(self) -> dict:
        return await self.admin_db.get_revenue_metrics()