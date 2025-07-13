# backend/app/schemas/admin/reviews.py - АДМИНИСТРАТИВНЫЕ СХЕМЫ ДЛЯ ОТЗЫВОВ
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReviewAdminRead(BaseModel):
    """Полная информация об отзыве для админов"""
    id: int
    order_id: int
    rating: int
    text: str
    email: str  # Полный email для админов
    game_name: str
    is_anonymous: bool
    is_approved: bool
    created_at: datetime
    updated_at: datetime

    # Дополнительная информация о заказе
    order_amount: Optional[float] = None
    order_status: Optional[str] = None
    user_id: Optional[int] = None
    username: Optional[str] = None

    model_config = {
        "from_attributes": True
    }


class ReviewModerationAction(BaseModel):
    """Действие модерации отзыва"""
    action: str  # "approve" или "reject"
    reason: Optional[str] = None  # Причина отклонения


class ReviewAdminUpdate(BaseModel):
    """Обновление отзыва админом"""
    is_approved: Optional[bool] = None
    text: Optional[str] = None  # Админ может исправить текст
    rating: Optional[int] = None  # Админ может скорректировать рейтинг


class ReviewModerationStats(BaseModel):
    """Статистика модерации отзывов"""
    pending_reviews: int
    approved_reviews: int
    total_reviews: int
    recent_reviews: int  # За последние 24 часа