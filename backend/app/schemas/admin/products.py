from pydantic import BaseModel
from typing import Optional
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
    min_amount: Optional[Decimal] = 1
    max_amount: Optional[Decimal] = 1
    type: ProductType
    description: Optional[str] = None
    instructions: Optional[str] = None
    enabled: Optional[bool] = True
    delivery: Optional[str] = "auto"
    sort_order: Optional[int] = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductRead(ProductBase):
    id: int

    class Config:
        from_attributes = True
