from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class OrderStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    processing = "processing"
    done = "done"           # ✅ вместо completed
    canceled = "canceled"

class PaymentMethod(str, Enum):
    auto = "auto"
    manual = "manual"


class OrderBase(BaseModel):
    user_id: int
    product_id: int
    amount: float
    currency: str
    status: OrderStatus
    payment_method: PaymentMethod
    created_at: datetime


class OrderRead(OrderBase):
    id: int

    class Config:
        from_attributes = True


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    amount: Optional[float] = None
