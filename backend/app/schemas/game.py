# backend/app/schemas/game.py - ОБНОВЛЕННАЯ ВЕРСИЯ С ПОДКАТЕГОРИЯМИ
from pydantic import BaseModel
from typing import Optional, List
from app.schemas.game_subcategory import GameSubcategoryRead


class FAQItem(BaseModel):
    """Схема для элемента FAQ"""
    question: str
    answer: str


class GameBase(BaseModel):
    name: str
    banner_url: Optional[str] = None
    auto_support: bool = True
    instructions: Optional[str] = None
    description: Optional[str] = None  # Описание игры
    logo_url: Optional[str] = None  # Квадратная картинка для карточки


class GameCreate(GameBase):
    faq_content: Optional[str] = None  # FAQ в JSON формате
    sort_order: Optional[int] = 0
    enabled: Optional[bool] = True


class GameRead(GameBase):
    id: int
    sort_order: int
    enabled: Optional[bool] = True
    faq_content: Optional[str] = None
    subcategory_description: Optional[str] = None
    products: Optional[List] = []  # Будет заполнено при загрузке
    subcategories: Optional[List[GameSubcategoryRead]] = []  # Подкатегории игры

    model_config = {
        "from_attributes": True
    }


# Для админки - отдельная схема с подробностями
class GameAdminRead(GameRead):
    """Расширенная схема для админки"""
    pass


class GameUpdate(BaseModel):
    """Схема для обновления игры"""
    name: Optional[str] = None
    banner_url: Optional[str] = None
    auto_support: Optional[bool] = None
    instructions: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    faq_content: Optional[str] = None
    subcategory_description: Optional[str] = None
    sort_order: Optional[int] = None
    enabled: Optional[bool] = None