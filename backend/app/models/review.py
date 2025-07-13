# backend/app/models/review.py - НОВАЯ МОДЕЛЬ ДЛЯ ОТЗЫВОВ
from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)

    # Связь с заказом (уникальная - один заказ = один отзыв максимум)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Основные поля отзыва
    rating = Column(Integer, nullable=False)  # 1-5 звезд
    text = Column(Text, nullable=False)  # Текст отзыва

    # Email пользователя (для анонимных и авторизованных)
    email = Column(String(255), nullable=False)

    # Название игры (копируется из заказа для удобства)
    game_name = Column(String(255), nullable=False)

    # Флаги состояния
    is_approved = Column(Boolean, default=False, nullable=False)  # Одобрен админом
    is_anonymous = Column(Boolean, default=False, nullable=False)  # Анонимный отзыв

    # Временные метки
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="review")

    # Ограничения
    __table_args__ = (
        UniqueConstraint('order_id', name='uix_reviews_order_id'),
    )

    def get_masked_email(self):
        """Возвращает частично скрытый email для отображения"""
        if not self.email:
            return "***@***"

        parts = self.email.split('@')
        if len(parts) != 2:
            return "***@***"

        username, domain = parts

        # Скрываем часть username
        if len(username) <= 2:
            masked_username = '*' * len(username)
        else:
            masked_username = username[0] + '*' * (len(username) - 2) + username[-1]

        # Скрываем часть домена
        domain_parts = domain.split('.')
        if len(domain_parts) >= 2:
            masked_domain = domain_parts[0][0] + '*' * (len(domain_parts[0]) - 1)
            for part in domain_parts[1:]:
                masked_domain += '.' + part
        else:
            masked_domain = '*' * len(domain)

        return f"{masked_username}@{masked_domain}"

    def __repr__(self):
        return f"<Review(id={self.id}, order_id={self.order_id}, rating={self.rating}, approved={self.is_approved})>"