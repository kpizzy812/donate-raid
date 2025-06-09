from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, DateTime, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
import enum


class OrderStatus(enum.Enum):
    pending = "pending"
    paid = "paid"
    processing = "processing"
    done = "done"
    canceled = "canceled"


class PaymentMethod(enum.Enum):
    auto = "auto"
    manual = "manual"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    manual_game_name = Column(String(255), nullable=True)

    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), nullable=False)  # TON, XGEN, USDT
    status = Column(Enum(OrderStatus), default=OrderStatus.pending, nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    transaction_id = Column(String(255), nullable=True)
    auto_processed = Column(Boolean, default=True)

    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="orders")
    game = relationship("Game")
    product = relationship("Product")


