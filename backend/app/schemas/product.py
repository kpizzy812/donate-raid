# backend/app/schemas/product.py - ОСНОВНАЯ СХЕМА ПРОДУКТОВ
from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from enum import Enum


class ProductType(str, Enum):
    currency = "currency"
    item = "item"
    service = "service"


class InputField(BaseModel):
    name: str
    label: str
    type: str = "text"
    required: bool = True
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    options: Optional[List[str]] = None
    validation_regex: Optional[str] = None
    min_length: Optional[int] = None
    max_length: Optional[int] = None


class ProductBase(BaseModel):
    game_id: int
    name: str
    price_rub: Decimal
    old_price_rub: Optional[Decimal] = None
    min_amount: Optional[Decimal] = 1
    max_amount: Optional[Decimal] = 1
    type: ProductType
    description: Optional[str] = None
    instructions: Optional[str] = None
    enabled: Optional[bool] = True
    delivery: Optional[str] = "auto"
    sort_order: Optional[int] = 0
    input_fields: Optional[List[InputField]] = []
    special_note: Optional[str] = None
    note_type: Optional[str] = "warning"
    subcategory_id: Optional[int] = None
    subcategory: Optional[str] = None  # Для совместимости
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductRead(ProductBase):
    id: int
    subcategory_name: Optional[str] = None  # Вычисляемое поле

    model_config = {
        "from_attributes": True
    }