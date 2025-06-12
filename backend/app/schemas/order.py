# backend/app/schemas/order.py - ОБНОВЛЕННАЯ ВЕРСИЯ
from pydantic import BaseModel, Field
from enum import Enum
from decimal import Decimal
from typing import Optional, List
from datetime import datetime


class GameShort(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class ProductShort(BaseModel):
    id: int
    name: str
    price_rub: Decimal

    class Config:
        from_attributes = True


class OrderStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    processing = "processing"
    done = "done"
    canceled = "canceled"


class PaymentMethod(str, Enum):
    auto = "auto"  # Для совместимости
    manual = "manual"  # Для совместимости
    sberbank = "sberbank"  # Сбербанк Касса
    sbp = "sbp"  # СБП
    ton = "ton"  # TON криптовалюта
    usdt = "usdt"  # USDT TON
    unitpay = "unitpay"  # UnitPay (резерв)


class OrderCreate(BaseModel):
    user_id: Optional[int] = None
    game_id: int
    product_id: int
    amount: Decimal
    currency: str
    payment_method: PaymentMethod
    manual_game_name: str | None = None
    comment: Optional[str] = None
    auto_processed: Optional[bool] = True


class OrderBulkItem(BaseModel):
    game_id: int
    product_id: int
    amount: Decimal
    currency: str
    payment_method: PaymentMethod
    comment: str | None = None


class OrderBulkCreate(BaseModel):
    items: List[OrderBulkItem]


class OrderRead(BaseModel):
    id: int
    amount: Decimal
    currency: str
    status: OrderStatus
    payment_method: PaymentMethod
    transaction_id: Optional[str] = None
    payment_url: Optional[str] = None
    comment: Optional[str]
    created_at: datetime
    game: Optional[GameShort]
    product: Optional[ProductShort]

    class Config:
        from_attributes = True
        use_enum_values = True


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    transaction_id: Optional[str] = None
    payment_url: Optional[str] = None