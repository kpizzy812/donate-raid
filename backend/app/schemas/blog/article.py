# backend/app/schemas/blog/article.py - ОБНОВЛЕННЫЕ СХЕМЫ С МНОЖЕСТВЕННЫМИ КАТЕГОРИЯМИ
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
    is_category: Optional[bool] = False

    class Config:
        from_attributes = True


class CategoryRead(BaseModel):
    """Схема для чтения категорий с количеством статей"""
    id: int
    name: str
    slug: str
    color: str
    article_count: int


class TagRead(BaseModel):
    """Схема для чтения тегов с количеством статей"""
    id: int
    name: str
    slug: str
    color: str
    article_count: int


class ArticleBase(BaseModel):
    title: str
    slug: str
    content: str
    category: Optional[str] = None  # Основная категория для совместимости
    excerpt: Optional[str] = None
    game_id: Optional[int] = None
    published: Optional[bool] = True
    author_name: Optional[str] = None
    featured_image_url: Optional[str] = None
    featured_image_alt: Optional[str] = None


class ArticleCreate(ArticleBase):
    pass


class ArticleRead(ArticleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

    # Все теги (включая категории)
    tags: Optional[List[ArticleTagRead]] = []

    # Вычисляемые свойства для удобства фронтенда
    @property
    def categories(self) -> List[str]:
        """Возвращает список названий категорий"""
        if not self.tags:
            return [self.category] if self.category else []
        category_names = [tag.name for tag in self.tags if tag.is_category]
        # Если нет категорий в тегах, используем старое поле category для совместимости
        return category_names if category_names else ([self.category] if self.category else [])

    @property
    def regular_tags(self) -> List[str]:
        """Возвращает список названий обычных тегов"""
        if not self.tags:
            return []
        return [tag.name for tag in self.tags if not tag.is_category]

    @property
    def all_tag_names(self) -> List[str]:
        """Возвращает все названия тегов (категории + обычные)"""
        return [tag.name for tag in self.tags] if self.tags else []

    # Для совместимости с фронтендом
    @property
    def featured_image(self) -> Optional[str]:
        return self.featured_image_url

    @property
    def primary_category(self) -> str:
        """Возвращает первую категорию или значение из поля category"""
        categories = self.categories
        return categories[0] if categories else "Новости"

    class Config:
        from_attributes = True