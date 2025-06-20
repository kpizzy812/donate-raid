# backend/app/schemas/game_subcategory.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class GameSubcategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    sort_order: Optional[int] = 0
    enabled: Optional[bool] = True


class GameSubcategoryCreate(GameSubcategoryBase):
    game_id: int


class GameSubcategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    enabled: Optional[bool] = None


class GameSubcategoryRead(GameSubcategoryBase):
    id: int
    game_id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class GameSubcategoryReadWithGame(GameSubcategoryRead):
    """Схема с информацией об игре"""
    game_name: Optional[str] = None

    @classmethod
    def from_orm_with_game(cls, obj):
        """Создает объект с названием игры"""
        return cls(
            id=obj.id,
            game_id=obj.game_id,
            name=obj.name,
            description=obj.description,
            sort_order=obj.sort_order,
            enabled=obj.enabled,
            created_at=obj.created_at,
            game_name=obj.game.name if obj.game else None
        )