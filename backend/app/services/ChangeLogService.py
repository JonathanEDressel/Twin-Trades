from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.AdminDbContext import AdminDbContext
from app.helper.Logger import logger


class ChangeLogService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.admin_db = AdminDbContext(session)

    async def record(self, actor_id: int | None, entity_type: str, entity_id: int | None, action: str, detail: str | None = None) -> None:
        try:
            await self.admin_db.insert_change_log(actor_id, entity_type, entity_id, action, detail)
        except Exception as e:
            logger.warning(f"Failed to write change log: {e}")
