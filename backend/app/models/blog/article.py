# backend/app/models/blog/article.py - НОВАЯ ВЕРСИЯ С МНОЖЕСТВЕННЫМИ КАТЕГОРИЯМИ
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
    """Модель тегов для статей (включая категории)"""
    __tablename__ = "article_tags_table"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # "Новости", "Гайд", "CS2", "Промокод"
    slug = Column(String(50), unique=True, nullable=False)  # "novosti", "guide", "cs2", "promocode"
    color = Column(String(7), default="#3B82F6")  # Цвет тега в hex формате
    is_category = Column(Boolean, default=False)  # TRUE для категорий, FALSE для обычных тегов
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    articles = relationship("Article", secondary=article_tags, back_populates="tags")

    @classmethod
    def get_categories(cls, db):
        """Получить все теги-категории"""
        return db.query(cls).filter(cls.is_category == True).all()

    @classmethod
    def get_regular_tags(cls, db):
        """Получить все обычные теги"""
        return db.query(cls).filter(cls.is_category == False).all()


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    content = Column(Text, nullable=False)
    excerpt = Column(String(500), nullable=True)  # Краткое описание

    # УСТАРЕЛО: оставляем для обратной совместимости, но не используем
    category = Column(String(100), nullable=True)  # Основная категория для совместимости

    # Связь с игрой (опционально)
    game_id = Column(Integer, ForeignKey('games.id'), nullable=True)

    # Автор статьи
    author_name = Column(String(100), nullable=True)

    # Изображения
    featured_image_url = Column(String(500), nullable=True)  # Главное изображение статьи
    featured_image_alt = Column(String(255), nullable=True)  # Alt текст для изображения

    published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)

    # Relationships
    tags = relationship("ArticleTag", secondary=article_tags, back_populates="articles")
    game = relationship("Game", back_populates="articles")  # Связь с игрой

    def get_categories(self):
        """Получить категории статьи (теги с is_category=True)"""
        return [tag for tag in self.tags if tag.is_category]

    def get_regular_tags(self):
        """Получить обычные теги статьи (теги с is_category=False)"""
        return [tag for tag in self.tags if not tag.is_category]

    def get_category_names(self):
        """Получить список названий категорий"""
        return [tag.name for tag in self.tags if tag.is_category]

    def get_tag_names(self):
        """Получить список названий обычных тегов"""
        return [tag.name for tag in self.tags if not tag.is_category]

    def get_all_tag_names(self):
        """Получить все теги (и категории, и обычные)"""
        return [tag.name for tag in self.tags]

    def add_category(self, category_name: str, db):
        """Добавить категорию к статье"""
        tag = db.query(ArticleTag).filter_by(name=category_name, is_category=True).first()
        if not tag:
            # Создаем новую категорию
            tag_slug = category_name.lower().replace(" ", "-").replace("ё", "e")
            import re
            tag_slug = re.sub(r'[^a-za-я0-9\-]', '', tag_slug)
            tag = ArticleTag(name=category_name, slug=tag_slug, is_category=True)
            db.add(tag)
            db.commit()
            db.refresh(tag)

        if tag not in self.tags:
            self.tags.append(tag)

    def add_tag(self, tag_name: str, db):
        """Добавить обычный тег к статье"""
        tag = db.query(ArticleTag).filter_by(name=tag_name, is_category=False).first()
        if not tag:
            # Создаем новый тег
            tag_slug = tag_name.lower().replace(" ", "-").replace("ё", "e")
            import re
            tag_slug = re.sub(r'[^a-za-я0-9\-]', '', tag_slug)
            tag = ArticleTag(name=tag_name, slug=tag_slug, is_category=False)
            db.add(tag)
            db.commit()
            db.refresh(tag)

        if tag not in self.tags:
            self.tags.append(tag)

    def get_reading_time(self):
        """Примерное время чтения статьи (слов в минуту)"""
        if not self.content:
            return 1
        word_count = len(self.content.split())
        return max(1, round(word_count / 200))  # 200 слов в минуту

    @property
    def primary_category(self):
        """Возвращает первую категорию для совместимости"""
        categories = self.get_categories()
        return categories[0].name if categories else self.category