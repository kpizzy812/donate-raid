# backend/app/models/product.py - ИСПРАВЛЕННАЯ ВЕРСИЯ С ПРАВИЛЬНЫМИ СВОЙСТВАМИ
from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Boolean, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from app.core.database import Base
import enum


class ProductType(enum.Enum):
    currency = "currency"
    item = "item"
    service = "service"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(100), nullable=False)
    price_rub = Column(Numeric(10, 2), nullable=False)
    old_price_rub = Column(Numeric(10, 2), nullable=True)  # Старая цена

    min_amount = Column(Numeric(10, 2), default=1)
    max_amount = Column(Numeric(10, 2), default=1)

    type = Column(Enum(ProductType), nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)

    enabled = Column(Boolean, default=True)
    delivery = Column(String(20), default="auto")  # auto / manual
    sort_order = Column(Integer, default=0, nullable=False)

    # Настраиваемые поля ввода
    input_fields = Column(JSON, nullable=True)

    # Особые пометки
    special_note = Column(String(255), nullable=True)  # Текст пометки
    note_type = Column(String(20), default="warning")  # warning, info, danger

    # ОБНОВЛЕНО: Подкатегория теперь foreign key
    subcategory_id = Column(Integer, ForeignKey("game_subcategories.id", ondelete="SET NULL"), nullable=True)

    # ОСТАВЛЯЕМ для обратной совместимости на время миграции
    subcategory = Column(String(100), nullable=True)

    image_url = Column(String(255), nullable=True)

    # Relationships
    game = relationship("Game", back_populates="products")
    subcategory_obj = relationship("GameSubcategory", back_populates="products")

    @property
    def subcategory_name(self):
        """Возвращает название подкатегории для совместимости"""
        if self.subcategory_obj:
            return self.subcategory_obj.name
        return self.subcategory  # Fallback на старое поле

    def __str__(self):
        return f"{self.game.name} - {self.name}"