from pydantic import BaseModel
from typing import Optional

class GameBase(BaseModel):
    name: str
    banner_url: Optional[str] = None
    auto_support: bool = True
    instructions: Optional[str] = None
    sort_order: int = 0

class GameCreate(GameBase):
    pass

class GameUpdate(GameBase):
    pass

class GameRead(GameBase):
    id: int

    class Config:
        from_attributes = True
