# backend/app/schemas/admin/games.py - ОБНОВЛЕННАЯ ВЕРСИЯ С ПОЛЯМИ ВВОДА

from pydantic import BaseModel
from typing import Optional, List


class FAQItem(BaseModel):
    """Схема для элемента FAQ"""
    question: str
    answer: str


# ДОБАВЛЕНО: Схема для поля ввода с поддержкой subcategory_id
class InputFieldAdmin(BaseModel):
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
    subcategory_id: Optional[int] = None  # КЛЮЧЕВОЕ ПОЛЕ для привязки к подкатегории


class GameBase(BaseModel):
    name: str
    banner_url: Optional[str] = None
    auto_support: bool = True
    instructions: Optional[str] = None
    description: Optional[str] = None  # Описание игры
    logo_url: Optional[str] = None  # Квадратная картинка для карточки
    sort_order: Optional[int] = 0
    enabled: Optional[bool] = True
    subcategory_description: Optional[str] = None  # ДОБАВЛЕНО: описание подкатегорий


class GameCreate(GameBase):
    faq_content: Optional[str] = None  # FAQ в JSON формате
    input_fields: Optional[List[InputFieldAdmin]] = []  # ДОБАВЛЕНО: поля ввода


class GameUpdate(BaseModel):
    """Схема для обновления игры - все поля опциональные"""
    name: Optional[str] = None
    banner_url: Optional[str] = None
    auto_support: Optional[bool] = None
    instructions: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    faq_content: Optional[str] = None
    sort_order: Optional[int] = None
    enabled: Optional[bool] = None
    subcategory_description: Optional[str] = None  # ДОБАВЛЕНО
    input_fields: Optional[List[InputFieldAdmin]] = None  # ДОБАВЛЕНО: поля ввода


class GameRead(GameBase):
    id: int
    faq_content: Optional[str] = None
    input_fields: Optional[List[InputFieldAdmin]] = []  # ДОБАВЛЕНО: поля ввода

    # Вычисляемое свойство для FAQ (для фронтенда)
    @property
    def faq_list(self) -> List[FAQItem]:
        """Возвращает FAQ в виде списка объектов"""
        if not self.faq_content:
            return []

        try:
            import json
            faq_data = json.loads(self.faq_content)
            return [FAQItem(**item) for item in faq_data if isinstance(item, dict)]
        except:
            return []

    model_config = {
        "from_attributes": True
    }