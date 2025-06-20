# backend/app/schemas/game.py - ОБНОВЛЕННАЯ ВЕРСИЯ С ПОЛЯМИ ВВОДА
from pydantic import BaseModel
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.product import ProductRead
    from app.schemas.game_subcategory import GameSubcategoryRead

# Схема для поля ввода
class InputField(BaseModel):
    name: str
    label: str
    type: str = "text"  # text, email, password, number, select, textarea
    required: bool = True
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    options: Optional[List[str]] = None
    validation_regex: Optional[str] = None
    min_length: Optional[int] = None
    max_length: Optional[int] = None

# Схемы для избежания циклического импорта
class ProductReadForGame(BaseModel):
    id: int
    name: str
    price_rub: float
    old_price_rub: Optional[float] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    type: str
    subcategory_id: Optional[int] = None
    subcategory_name: Optional[str] = None
    special_note: Optional[str] = None
    note_type: str = "warning"
    image_url: Optional[str] = None
    min_amount: float = 1
    max_amount: float = 1

    model_config = {
        "from_attributes": True
    }


class GameSubcategoryReadForGame(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    sort_order: int
    enabled: bool

    model_config = {
        "from_attributes": True
    }


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
    subcategory_description: Optional[str] = None
    input_fields: Optional[List[InputField]] = []  # ДОБАВЛЕНО: поля ввода


class GameRead(GameBase):
    id: int
    sort_order: int
    enabled: Optional[bool] = True
    faq_content: Optional[str] = None
    subcategory_description: Optional[str] = None
    input_fields: Optional[List[InputField]] = []  # ДОБАВЛЕНО: поля ввода
    # ИСПРАВЛЕНО: Правильная типизация списков
    products: List[ProductReadForGame] = []
    subcategories: List[GameSubcategoryReadForGame] = []

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
    input_fields: Optional[List[InputField]] = None  # ДОБАВЛЕНО: поля ввода