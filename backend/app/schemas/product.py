from pydantic import BaseModel, Field
from enum import Enum
from decimal import Decimal
from typing import Optional


class ProductType(str, Enum):
    currency = "currency"
    item = "item"
    service = "service"


class ProductCreate(BaseModel):
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


class ProductRead(BaseModel):
    id: int
    name: str
    price_rub: Decimal
    type: ProductType
    description: Optional[str]
    delivery: Optional[str]
    min_amount: Optional[Decimal]
    max_amount: Optional[Decimal]
    enabled: Optional[bool]
    sort_order: int

    class Config:
        from_attributes = True
