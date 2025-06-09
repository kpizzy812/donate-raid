from pydantic import BaseModel
from typing import Optional, List
from app.schemas.product import ProductRead  # создадим ниже


class GameBase(BaseModel):
    name: str
    banner_url: Optional[str] = None
    auto_support: bool = True
    instructions: Optional[str] = None


class GameCreate(GameBase):
    pass


class GameRead(GameBase):
    id: int
    sort_order: int
    products: List[ProductRead]

    model_config = {
        "from_attributes": True
    }
