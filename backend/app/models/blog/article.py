from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import enum

class ArticleCategory(str, enum.Enum):
    news = "Новости"
    guide = "Гайды"
    promo = "Промокоды"
    review = "Обзоры"
    pc = "ПК Игры"
    mobile = "Мобильные игры"

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(255), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)

    category = Column(Enum(ArticleCategory), nullable=False)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    author_name = Column(String(100), nullable=True)
    published = Column(Boolean, default=True)

    game = relationship("Game", backref="articles")
