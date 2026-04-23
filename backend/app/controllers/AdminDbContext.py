from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from app.models.UserModel import User


class AdminDbContext:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_all_users(self, page: int, page_size: int, **filters) -> tuple[list[User], int]:
        # Query all users with optional filters (role, is_active, deleted_at IS NOT NULL).
        # Return a (rows, total_count) tuple so the caller can build pagination metadata.
        # Include soft-deleted rows in the result set — admins see everything.
        pass

    async def insert_change_log(self, actor_id: int | None, entity_type: str, entity_id: int | None, action: str, detail: str | None = None) -> None:
        # INSERT a new row into change_log — this table is append-only, never UPDATE or DELETE.
        # Flush immediately so the log is durable even if the outer transaction is not yet committed.
        # This method must never raise — wrap DB errors in a silent logger.warning call.
        pass

    async def find_change_log(self, page: int, page_size: int) -> list:
        # Return paginated change_log rows ordered by created_at DESC.
        # Apply OFFSET/LIMIT based on page and page_size; return empty list if page is out of range.
        pass

    async def insert_error_log(self, path: str, method: str, status_code: int, message: str, traceback: str | None) -> None:
        # Insert a structured error row into error_logs with full request context and stack trace.
        # Must not raise — this is called from the global exception handler which cannot itself fail.
        pass

    async def find_error_logs(self, page: int, page_size: int) -> list:
        # Return paginated error_log rows ordered by created_at DESC.
        # Support optional date-range filter via start_date/end_date keyword args.
        pass

    async def get_revenue_metrics(self) -> dict:
        # Aggregate SUM(amount_paid) grouped by plan from the subscriptions table.
        # Compute MRR from active monthly subscriptions and ARR from active annual subscriptions.
        # Return a dict with keys: mrr, arr, lifetime_total, total_active_subscribers.
        pass
