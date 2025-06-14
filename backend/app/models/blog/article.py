# backend/app/models/blog/article.py - ИСПРАВЛЕННАЯ ВЕРСИЯ
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Table, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

# Промежуточная таблица для связи многие-ко-многим между статьями и тегами
article_tags = Table(
    'article_tags',
    Base.metadata,
    Column('article_id', Integer, ForeignKey('articles.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('article_tags_table.id'), primary_key=True)
)


class ArticleTag(Base):
    """Модель тегов для статей"""
    __tablename__ = "article_tags_table"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # "Новости", "Гайд", "Обновление"
    slug = Column(String(50), unique=True, nullable=False)  # "novosti", "guide", "update"
    color = Column(String(7), default="#3B82F6")  # Цвет тега в hex формате
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    articles = relationship("Article", secondary=article_tags, back_populates="tags")


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    content = Column(Text, nullable=False)
    excerpt = Column(String(500), nullable=True)  # Краткое описание

    # Добавляем поле category для обратной совместимости
    category = Column(String(100), nullable=True)  # Основная категория для совместимости

    # Связь с игрой (опционально)
    game_id = Column(Integer, ForeignKey('games.id'), nullable=True)

    # Автор статьи
    author_name = Column(String(100), nullable=True)

    # Новые поля для изображений
    featured_image_url = Column(String(500), nullable=True)  # Главное изображение статьи
    featured_image_alt = Column(String(255), nullable=True)  # Alt текст для изображения

    published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)

    # Relationships
    tags = relationship("ArticleTag", secondary=article_tags, back_populates="articles")
    game = relationship("Game", back_populates="articles")  # Связь с игрой

    def get_tag_names(self):
        """Получить список названий тегов"""
        return [tag.name for tag in self.tags]

    def get_reading_time(self):
        """Примерное время чтения статьи (слов в минуту)"""
        if not self.content:
            return 1
        word_count = len(self.content.split())
        return max(1, round(word_count / 200))  # 200 слов в минуту