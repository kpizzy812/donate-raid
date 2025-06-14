# backend/app/schemas/admin/articles.py - ФИНАЛЬНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ArticleCategory(str, Enum):
    news = "Новости"
    guide = "Гайды"
    promo = "Промокоды"
    review = "Обзоры"
    pc = "ПК Игры"
    mobile = "Мобильные игры"


class ArticleTagRead(BaseModel):
    """Схема для чтения тегов"""
    id: int
    name: str
    slug: str
    color: Optional[str] = "#3B82F6"

    class Config:
        from_attributes = True


class ArticleBase(BaseModel):
    title: str
    slug: str
    content: str
    category: Optional[str] = None  # Для обратной совместимости
    excerpt: Optional[str] = None
    game_id: Optional[int] = None
    published: Optional[bool] = True
    author_name: Optional[str] = None
    featured_image_url: Optional[str] = None
    featured_image_alt: Optional[str] = None


class ArticleCreate(ArticleBase):
    # Поддерживаем старые поля для совместимости с фронтендом
    featured_image: Optional[str] = None  # Для совместимости
    tags: Optional[List[str]] = []
    categories: Optional[List[str]] = []


class ArticleUpdate(ArticleBase):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None


class ArticleRead(ArticleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

    # Добавляем теги в ответ
    tags: Optional[List[ArticleTagRead]] = []

    # Для совместимости с фронтендом добавляем список названий тегов
    @property
    def tag_names(self) -> List[str]:
        return [tag.name for tag in self.tags] if self.tags else []

    class Config:
        from_attributes = True