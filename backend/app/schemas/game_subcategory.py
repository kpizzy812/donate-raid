# backend/app/schemas/game_subcategory.py - СХЕМА ПОДКАТЕГОРИЙ ИГР
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class GameSubcategoryBase(BaseModel):
    game_id: int
    name: str
    description: Optional[str] = None
    sort_order: int = 0
    enabled: bool = True


class GameSubcategoryCreate(GameSubcategoryBase):
    pass


class GameSubcategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    enabled: Optional[bool] = None


class GameSubcategoryRead(GameSubcategoryBase):
    id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }