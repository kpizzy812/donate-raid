from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Boolean, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from app.core.database import Base
import enum

class ProductType(enum.Enum):
    currency = "currency"
    item     = "item"
    service  = "service"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(100), nullable=False)
    price_rub = Column(Numeric(10, 2), nullable=False)

    min_amount = Column(Numeric(10, 2), default=1)
    max_amount = Column(Numeric(10, 2), default=1)

    type = Column(Enum(ProductType), nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)

    enabled = Column(Boolean, default=True)
    delivery = Column(String(20), default="auto")  # auto / manual
    sort_order = Column(Integer, default=0, nullable=False)
    input_fields = Column(JSON, nullable=True)

    game = relationship("Game", back_populates="products")

