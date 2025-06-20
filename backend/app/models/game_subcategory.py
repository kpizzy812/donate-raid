# backend/app/models/game_subcategory.py - ОБНОВЛЕННАЯ ВЕРСИЯ С ПОЛЯМИ ВВОДА
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
    products = relationship("Product", back_populates="subcategory_obj", lazy="select")
    input_fields = relationship("GameInputField", back_populates="subcategory", cascade="all, delete-orphan", order_by="GameInputField.sort_order")  # ДОБАВЛЕНО

    def __str__(self):
        return f"{self.game.name if self.game else 'Unknown'} - {self.name}"

    def get_input_fields_dict(self):
        """Возвращает поля ввода в формате для фронтенда"""
        return [field.to_dict() for field in self.input_fields if field.enabled]