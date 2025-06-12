# backend/app/schemas/admin/products.py - ОБНОВЛЕННАЯ ВЕРСИЯ
from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from enum import Enum


class ProductType(str, Enum):
    currency = "currency"
    item = "item"
    service = "service"


class InputFieldType(str, Enum):
    text = "text"
    email = "email"
    password = "password"
    number = "number"
    select = "select"
    textarea = "textarea"


class InputField(BaseModel):
    name: str  # Название поля (например "player_id", "email")
    label: str  # Отображаемое название (например "Player ID", "Email адрес")
    type: InputFieldType = InputFieldType.text
    required: bool = True
    placeholder: Optional[str] = None
    help_text: Optional[str] = None  # Подсказка под полем
    options: Optional[List[str]] = None  # Для select полей
    validation_regex: Optional[str] = None  # Регулярное выражение для валидации
    min_length: Optional[int] = None
    max_length: Optional[int] = None


class ProductBase(BaseModel):
    game_id: int
    name: str
    price_rub: Decimal
    old_price_rub: Optional[Decimal] = None  # Старая цена для зачеркивания
    min_amount: Optional[Decimal] = 1
    max_amount: Optional[Decimal] = 1
    type: ProductType
    description: Optional[str] = None
    instructions: Optional[str] = None
    enabled: Optional[bool] = True
    delivery: Optional[str] = "auto"
    sort_order: Optional[int] = 0
    input_fields: Optional[List[InputField]] = []  # Настраиваемые поля ввода
    special_note: Optional[str] = None  # Особая пометка (например "Не подходит для РУ аккаунта")
    note_type: Optional[str] = "warning"  # warning, info, danger
    subcategory: Optional[str] = None  # Подкатегория товара
    image_url: Optional[str] = None  # 🆕 URL картинки товара


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductRead(ProductBase):
    id: int

    class Config:
        from_attributes = True