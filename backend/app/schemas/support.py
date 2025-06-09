from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class SupportStatus(str, Enum):
    new = "new"
    in_progress = "in_progress"
    resolved = "resolved"


class SupportMessageCreate(BaseModel):
    message: str


class SupportMessageRead(BaseModel):
    id: int
    user_id: Optional[int] = None
    message: str
    is_from_user: bool
    created_at: datetime
    status: SupportStatus
    admin_id: Optional[int] = None
    thread_id: Optional[int] = None

    class Config:
        from_attributes = True
