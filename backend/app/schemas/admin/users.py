from pydantic import BaseModel
from typing import Optional


class UserRead(BaseModel):
    id: int
    email: Optional[str]
    username: Optional[str]
    role: str
    balance: float

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    email: Optional[str]
    username: Optional[str]
    role: Optional[str]
    balance: Optional[float]
