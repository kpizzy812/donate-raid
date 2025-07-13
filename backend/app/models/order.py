# backend/app/models/order.py - ОБНОВЛЕННАЯ ВЕРСИЯ С ОТЗЫВАМИ
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
    auto = "auto"  # Автоматический способ (для совместимости)
    manual = "manual"  # Ручной способ (для совместимости)
    sberbank = "sberbank"  # Сбербанк Касса
    sbp = "sbp"  # Система быстрых платежей
    ton = "ton"  # TON криптовалюта
    usdt = "usdt"  # USDT TON стейблкоин
    unitpay = "unitpay"  # UnitPay (резерв)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    manual_game_name = Column(String(255), nullable=True)

    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), nullable=False)  # RUB, TON, USDT
    status = Column(Enum(OrderStatus), default=OrderStatus.pending, nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    transaction_id = Column(String(255), nullable=True)  # ID транзакции от платежной системы
    payment_url = Column(String(500), nullable=True)  # Ссылка для оплаты (для криптовалют)
    auto_processed = Column(Boolean, default=True)

    comment = Column(Text, nullable=True)  # Данные пользователя в JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="orders")
    game = relationship("Game")
    product = relationship("Product")

    # ДОБАВЛЕНО: Связь с отзывом (один заказ = один отзыв максимум)
    review = relationship("Review", back_populates="order", uselist=False, cascade="all, delete-orphan")

    def can_leave_review(self):
        """Проверяет, можно ли оставить отзыв на этот заказ"""
        # Отзыв можно оставить только после финального статуса
        if self.status != OrderStatus.done:
            return False

        # Отзыв еще не оставлен
        if self.review is not None:
            return False

        return True

    def __repr__(self):
        return f"<Order(id={self.id}, status={self.status}, amount={self.amount})>"