from pydantic import BaseModel
from datetime import datetime


class ChangeLogEntryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    actor_id: int | None
    entity_type: str    # "portfolio" | "user" | "subscription" | etc.
    entity_id: int | None
    action: str         # "create" | "update" | "delete" | "join" | "leave" | etc.
    detail: str | None
    created_at: datetime
