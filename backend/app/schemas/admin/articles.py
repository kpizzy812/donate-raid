from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class ArticleCategory(str, Enum):
    news = "Новости"
    guide = "Гайды"
    promo = "Промокоды"
    review = "Обзоры"
    pc = "ПК Игры"
    mobile = "Мобильные игры"

class ArticleBase(BaseModel):
    title: str
    slug: str
    content: str
    category: ArticleCategory
    game_id: Optional[int] = None
    published: Optional[bool] = True
    author_name: Optional[str] = None

class ArticleCreate(ArticleBase):
    pass

class ArticleUpdate(ArticleBase):
    pass

class ArticleRead(ArticleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
