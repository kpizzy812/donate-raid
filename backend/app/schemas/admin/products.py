# backend/app/schemas/admin/products.py - ОБНОВЛЕННАЯ ВЕРСИЯ С SUBCATEGORY_ID
from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from enum import Enum


class ProductType(str, Enum):
    currency = "currency"
    item = "item"
    service = "service"


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
    special_note: Optional[str] = None
    note_type: Optional[str] = "warning"
    subcategory_id: Optional[int] = None
    subcategory: Optional[str] = None  # DEPRECATED
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductRead(ProductBase):
    id: int

    # Добавляем вычисляемое поле для названия подкатегории
    subcategory_name: Optional[str] = None

    model_config = {
        "from_attributes": True
    }


# Схема для отображения продукта с полной информацией о подкатегории
class ProductReadDetailed(ProductRead):
    subcategory_obj: Optional[dict] = None  # Полная информация о подкатегории