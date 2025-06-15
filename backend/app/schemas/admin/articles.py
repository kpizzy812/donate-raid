# backend/app/schemas/admin/articles.py - ИСПРАВЛЕННАЯ ВЕРСИЯ
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
    # ИСПРАВЛЕНО: Поддерживаем все необходимые поля для фронтенда
    featured_image: Optional[str] = None  # Base64 изображение
    tags: Optional[List[str]] = []  # Обычные теги
    categories: Optional[List[str]] = []  # Множественные категории


class ArticleUpdate(BaseModel):
    # ИСПРАВЛЕНО: Все поля опциональные для обновления
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    excerpt: Optional[str] = None
    game_id: Optional[int] = None
    published: Optional[bool] = None
    author_name: Optional[str] = None
    featured_image_url: Optional[str] = None
    featured_image_alt: Optional[str] = None

    # Дополнительные поля для обновления
    featured_image: Optional[str] = None  # Base64 изображение
    tags: Optional[List[str]] = None  # Теги
    categories: Optional[List[str]] = None  # Категории


class ArticleRead(ArticleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

    # ИСПРАВЛЕНО: Добавляем теги в ответ
    tags: Optional[List[ArticleTagRead]] = []

    # ИСПРАВЛЕНО: Вычисляемые свойства для совместимости с фронтендом
    @property
    def tag_names(self) -> List[str]:
        """Возвращает список названий тегов для совместимости"""
        return [tag.name for tag in self.tags] if self.tags else []

    @property
    def featured_image(self) -> Optional[str]:
        """Возвращает featured_image_url как featured_image для совместимости"""
        return self.featured_image_url

    class Config:
        from_attributes = True