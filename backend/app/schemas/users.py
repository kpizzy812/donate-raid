from pydantic import BaseModel
from typing import Optional
from enum import Enum
from app.schemas.order import OrderRead
from typing import List



class UserRole(str, Enum):
    user = "user"
    admin = "admin"


class UserCreate(BaseModel):
    telegram_id: int
    username: Optional[str] = None


class UserOut(BaseModel):
    id: int
    telegram_id: Optional[int] = None
    email: Optional[str] = None
    username: Optional[str] = None
    role: UserRole
    balance: float
    orders: Optional[List[OrderRead]] = []

    class Config:
        from_attributes = True
