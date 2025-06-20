# backend/app/models/game_subcategory.py
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class GameSubcategory(Base):
    """Модель подкатегорий игр (например: Россия, Глобал, Индонезия для Mobile Legends)"""
    __tablename__ = "game_subcategories"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(100), nullable=False)  # "Россия", "Глобал", "Индонезия"
    description = Column(Text, nullable=True)  # Описание подкатегории
    sort_order = Column(Integer, default=0, nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    game = relationship("Game", back_populates="subcategories")
    products = relationship("Product", back_populates="subcategory_obj")

    def __str__(self):
        return f"{self.game.name} - {self.name}"