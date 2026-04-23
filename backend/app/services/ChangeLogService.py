from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.AdminDbContext import AdminDbContext


class ChangeLogService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.admin_db = AdminDbContext(session)

    async def record(self, actor_id: int | None, entity_type: str, entity_id: int | None, action: str, detail: str | None = None) -> None:
        # Append a new row to change_log via AdminDbContext.insert_change_log — never UPDATE or DELETE.
        # This method must never raise; wrap any DB error in a silent logger.warning call.
        # Called at the end of every state-changing service method to maintain a full audit trail.
        pass
