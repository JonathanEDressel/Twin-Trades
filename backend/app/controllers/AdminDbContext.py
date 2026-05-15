from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, asc, desc
from app.models.UserModel import User
from app.models.PortfolioModel import Portfolio
from app.models.SubscriptionModel import Subscription, SubscriptionPlan, SubscriptionStatus
from app.models.AdminModel import ChangeLog, ErrorLog
from app.helper.Logger import logger


class AdminDbContext:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_all_users(self, page: int, page_size: int, search: str | None = None, sort_by: str = "created_at", sort_order: str = "desc") -> tuple[list[dict], int]:
        from app.models.TradeModel import Trade, TradeAction, TradeStatus
        from app.models.PortfolioModel import UserPortfolio

        offset = (page - 1) * page_size

        base_query = select(User).where(User.deleted_at.is_(None))
        count_query = select(func.count(User.id)).where(User.deleted_at.is_(None))

        if search:
            pattern = f"%{search.lower()}%"
            filter_clause = (
                func.lower(User.username).like(pattern) |
                func.lower(User.email).like(pattern)
            )
            base_query = base_query.where(filter_clause)
            count_query = count_query.where(filter_clause)

        total = (await self.session.execute(count_query)).scalar_one()

        _sort_col_map = {
            "username": User.username,
            "role": User.role,
            "is_active": User.is_active,
            "created_at": User.created_at,
        }
        if sort_by in _sort_col_map:
            _col = _sort_col_map[sort_by]
            _order = asc(_col) if sort_order == "asc" else desc(_col)
        elif sort_by == "subscription_plan":
            _sub = (
                select(Subscription.plan)
                .where(Subscription.user_id == User.id)
                .order_by(Subscription.created_at.desc())
                .limit(1)
                .scalar_subquery()
            )
            _order = asc(_sub) if sort_order == "asc" else desc(_sub)
        elif sort_by == "subscription_status":
            _sub = (
                select(Subscription.status)
                .where(Subscription.user_id == User.id)
                .order_by(Subscription.created_at.desc())
                .limit(1)
                .scalar_subquery()
            )
            _order = asc(_sub) if sort_order == "asc" else desc(_sub)
        else:
            _order = desc(User.created_at)

        users = list((await self.session.execute(
            base_query.order_by(_order).offset(offset).limit(page_size)
        )).scalars().all())

        if not users:
            return [], total

        user_ids = [u.id for u in users]

        sub_rows = (await self.session.execute(
            select(Subscription.user_id, Subscription.status, Subscription.plan)
            .where(Subscription.user_id.in_(user_ids))
            .order_by(Subscription.user_id.asc(), Subscription.created_at.desc())
        )).all()
        sub_map: dict[int, str | None] = {}
        sub_plan_map: dict[int, str | None] = {}
        for row in sub_rows:
            if row[0] not in sub_map:
                sub_map[row[0]] = row[1].value
                sub_plan_map[row[0]] = row[2].value

        portfolio_rows = (await self.session.execute(
            select(UserPortfolio.user_id, func.count(UserPortfolio.id))
            .where(UserPortfolio.user_id.in_(user_ids), UserPortfolio.left_at.is_(None))
            .group_by(UserPortfolio.user_id)
        )).all()
        portfolio_map = {row[0]: row[1] for row in portfolio_rows}

        trade_rows = (await self.session.execute(
            select(
                Trade.user_id,
                func.coalesce(func.sum(Trade.quantity * Trade.price), 0).label("total"),
            )
            .where(
                Trade.user_id.in_(user_ids),
                Trade.action == TradeAction.buy,
                Trade.status == TradeStatus.filled,
                Trade.price.isnot(None),
            )
            .group_by(Trade.user_id)
        )).all()
        invested_map = {row[0]: str(row[1]) for row in trade_rows}

        return [
            {
                "user": u,
                "subscription_status": sub_map.get(u.id),
                "subscription_plan": sub_plan_map.get(u.id),
                "portfolio_count": portfolio_map.get(u.id, 0),
                "invested_amount": invested_map.get(u.id, "0.00"),
            }
            for u in users
        ], total

    async def find_all_portfolios(self, page: int, page_size: int) -> tuple[list[dict], int]:
        from app.models.PortfolioModel import UserPortfolio
        from app.models.TradeModel import Trade, TradeAction, TradeStatus

        offset = (page - 1) * page_size
        total = (await self.session.execute(select(func.count(Portfolio.id)))).scalar_one()
        rows = list(
            (await self.session.execute(
                select(Portfolio).order_by(Portfolio.created_at.desc()).offset(offset).limit(page_size)
            )).scalars().all()
        )
        if not rows:
            return [], total

        portfolio_ids = [p.id for p in rows]

        user_count_rows = (await self.session.execute(
            select(UserPortfolio.portfolio_id, func.count(UserPortfolio.id).label("cnt"))
            .where(
                UserPortfolio.portfolio_id.in_(portfolio_ids),
                UserPortfolio.left_at.is_(None),
            )
            .group_by(UserPortfolio.portfolio_id)
        )).all()
        user_count_map = {r[0]: r[1] for r in user_count_rows}

        from app.models.TradeModel import RebalanceEvent as _RE
        invested_rows = (await self.session.execute(
            select(
                _RE.portfolio_id,
                func.coalesce(func.sum(Trade.quantity * Trade.price), 0).label("total"),
            )
            .join(_RE, Trade.rebalance_event_id == _RE.id)
            .where(
                _RE.portfolio_id.in_(portfolio_ids),
                Trade.action == TradeAction.buy,
                Trade.status == TradeStatus.filled,
                Trade.price.isnot(None),
            )
            .group_by(_RE.portfolio_id)
        )).all()
        invested_map = {r[0]: str(r[1]) for r in invested_rows}

        return [
            {
                "portfolio": p,
                "user_count": user_count_map.get(p.id, 0),
                "total_invested": invested_map.get(p.id, "0.00"),
            }
            for p in rows
        ], total

    async def find_portfolio_stats(self, portfolio_id: int) -> dict:
        from app.models.PortfolioModel import UserPortfolio
        from app.models.TradeModel import Trade, TradeAction, TradeStatus, RebalanceEvent

        user_count = (await self.session.execute(
            select(func.count(UserPortfolio.id))
            .where(UserPortfolio.portfolio_id == portfolio_id, UserPortfolio.left_at.is_(None))
        )).scalar_one()

        total_invested = (await self.session.execute(
            select(func.coalesce(func.sum(Trade.quantity * Trade.price), 0))
            .join(RebalanceEvent, Trade.rebalance_event_id == RebalanceEvent.id)
            .where(
                RebalanceEvent.portfolio_id == portfolio_id,
                Trade.action == TradeAction.buy,
                Trade.status == TradeStatus.filled,
                Trade.price.isnot(None),
            )
        )).scalar_one()

        return {"user_count": user_count, "total_invested": str(total_invested)}

    async def insert_change_log(self, actor_id: int | None, entity_type: str, entity_id: int | None, action: str, detail: str | None = None) -> None:
        try:
            entry = ChangeLog(
                actor_id=actor_id,
                entity_type=entity_type,
                entity_id=entity_id,
                action=action,
                detail=detail,
            )
            self.session.add(entry)
            await self.session.flush()
        except Exception as e:
            logger.warning(f"Failed to insert change log: {e}")

    async def find_change_log(self, page: int, page_size: int) -> tuple[list, int]:
        offset = (page - 1) * page_size
        total = (await self.session.execute(select(func.count(ChangeLog.id)))).scalar_one()
        rows = list(
            (await self.session.execute(
                select(ChangeLog).order_by(ChangeLog.created_at.desc()).offset(offset).limit(page_size)
            )).scalars().all()
        )
        return rows, total

    async def insert_error_log(self, path: str, method: str, status_code: int, message: str, traceback: str | None) -> None:
        try:
            entry = ErrorLog(
                path=path,
                method=method,
                status_code=status_code,
                message=message,
                traceback=traceback,
            )
            self.session.add(entry)
            await self.session.flush()
        except Exception as e:
            logger.warning(f"Failed to insert error log: {e}")

    async def find_error_logs(self, page: int, page_size: int) -> tuple[list, int]:
        offset = (page - 1) * page_size
        total = (await self.session.execute(select(func.count(ErrorLog.id)))).scalar_one()
        rows = list(
            (await self.session.execute(
                select(ErrorLog).order_by(ErrorLog.created_at.desc()).offset(offset).limit(page_size)
            )).scalars().all()
        )
        return rows, total

    async def get_revenue_metrics(self) -> dict:
        active_statuses = [SubscriptionStatus.active, SubscriptionStatus.grace_period]

        total_revenue = (await self.session.execute(
            select(func.coalesce(func.sum(Subscription.amount_paid), 0))
        )).scalar_one()

        monthly_revenue = (await self.session.execute(
            select(func.coalesce(func.sum(Subscription.amount_paid), 0))
            .where(
                Subscription.plan == SubscriptionPlan.monthly,
                Subscription.status.in_(active_statuses),
            )
        )).scalar_one()

        active_subscriptions = (await self.session.execute(
            select(func.count(Subscription.id))
            .where(Subscription.status.in_(active_statuses))
        )).scalar_one()

        breakdown_rows = (await self.session.execute(
            select(Subscription.plan, func.count(Subscription.id))
            .where(Subscription.status.in_(active_statuses))
            .group_by(Subscription.plan)
        )).all()
        plan_breakdown = {row[0].value: row[1] for row in breakdown_rows}

        return {
            "total_revenue": str(total_revenue),
            "monthly_revenue": str(monthly_revenue),
            "active_subscriptions": active_subscriptions,
            "plan_breakdown": plan_breakdown,
        }
