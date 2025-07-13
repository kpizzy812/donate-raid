# backend/app/schemas/review.py - СХЕМЫ ДЛЯ ОТЗЫВОВ
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime


class ReviewBase(BaseModel):
    rating: int
    text: str
    email: Optional[EmailStr] = None  # Для анонимных отзывов
    is_anonymous: bool = False


class ReviewCreate(ReviewBase):
    order_id: int

    @validator('rating')
    def validate_rating(cls, v):
        if not 1 <= v <= 5:
            raise ValueError('Рейтинг должен быть от 1 до 5')
        return v

    @validator('text')
    def validate_text(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('Отзыв должен содержать минимум 10 символов')
        if len(v.strip()) > 1000:
            raise ValueError('Отзыв не должен превышать 1000 символов')
        return v.strip()


class ReviewRead(BaseModel):
    id: int
    rating: int
    text: str
    game_name: str
    masked_email: str  # Частично скрытый email
    is_anonymous: bool
    is_approved: bool
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

    @staticmethod
    def from_model(review_model):
        """Создает ReviewRead из модели Review с обработкой masked_email"""
        return ReviewRead(
            id=review_model.id,
            rating=review_model.rating,
            text=review_model.text,
            game_name=review_model.game_name,
            masked_email=review_model.get_masked_email(),
            is_anonymous=review_model.is_anonymous,
            is_approved=review_model.is_approved,
            created_at=review_model.created_at
        )


class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    text: Optional[str] = None

    @validator('rating')
    def validate_rating(cls, v):
        if v is not None and not 1 <= v <= 5:
            raise ValueError('Рейтинг должен быть от 1 до 5')
        return v

    @validator('text')
    def validate_text(cls, v):
        if v is not None:
            if len(v.strip()) < 10:
                raise ValueError('Отзыв должен содержать минимум 10 символов')
            if len(v.strip()) > 1000:
                raise ValueError('Отзыв не должен превышать 1000 символов')
            return v.strip()
        return v


# Дополнительные схемы для статистики и фильтрации
class ReviewStats(BaseModel):
    total_reviews: int
    average_rating: float
    rating_distribution: dict  # {1: 0, 2: 1, 3: 5, 4: 15, 5: 25}


class ReviewFilter(BaseModel):
    rating: Optional[int] = None
    game_name: Optional[str] = None
    approved_only: bool = True