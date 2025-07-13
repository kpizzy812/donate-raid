# backend/app/routers/admin/reviews.py - АДМИНИСТРАТИВНЫЙ РОУТЕР ДЛЯ МОДЕРАЦИИ ОТЗЫВОВ
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, and_
from app.core.database import get_db
from app.services.auth import admin_required
from app.models.review import Review
from app.models.order import Order
from app.models.user import User
from app.schemas.admin.reviews import (
    ReviewAdminRead,
    ReviewModerationAction,
    ReviewAdminUpdate,
    ReviewModerationStats
)
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter()


# ------------------------------------------------------------
# 1) Получение всех отзывов для админа (с фильтрами)
# ------------------------------------------------------------
@router.get("", response_model=List[ReviewAdminRead])
def get_all_reviews_admin(
        approved: Optional[bool] = Query(None, description="Фильтр по статусу модерации"),
        rating: Optional[int] = Query(None, description="Фильтр по рейтингу"),
        game_name: Optional[str] = Query(None, description="Фильтр по игре"),
        limit: int = Query(50, le=200, description="Количество отзывов"),
        offset: int = Query(0, description="Смещение для пагинации"),
        db: Session = Depends(get_db),
        admin: User = Depends(admin_required)
):
    """Получить все отзывы для модерации"""
    print(f"▶▶▶ get_all_reviews_admin: approved={approved}, rating={rating}, limit={limit}")

    query = (
        db.query(Review)
        .options(
            joinedload(Review.order).joinedload(Order.user)
        )
    )

    # Применяем фильтры
    if approved is not None:
        query = query.filter(Review.is_approved == approved)

    if rating is not None:
        if not 1 <= rating <= 5:
            raise HTTPException(status_code=400, detail="Рейтинг должен быть от 1 до 5")
        query = query.filter(Review.rating == rating)

    if game_name:
        query = query.filter(Review.game_name.ilike(f"%{game_name}%"))

    # Сортировка: сначала неодобренные, потом по дате создания
    reviews = (
        query
        .order_by(Review.is_approved.asc(), desc(Review.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    print(f"    → Найдено {len(reviews)} отзывов для админа")

    # Преобразуем в административные схемы
    result = []
    for review in reviews:
        review_data = ReviewAdminRead(
            id=review.id,
            order_id=review.order_id,
            rating=review.rating,
            text=review.text,
            email=review.email,
            game_name=review.game_name,
            is_anonymous=review.is_anonymous,
            is_approved=review.is_approved,
            created_at=review.created_at,
            updated_at=review.updated_at,
            order_amount=float(review.order.amount) if review.order else None,
            order_status=review.order.status.value if review.order else None,
            user_id=review.order.user_id if review.order else None,
            username=review.order.user.username if review.order and review.order.user else None
        )
        result.append(review_data)

    return result


# ------------------------------------------------------------
# 2) Получение отзыва по ID для админа
# ------------------------------------------------------------
@router.get("/{review_id}", response_model=ReviewAdminRead)
def get_review_admin(
        review_id: int,
        db: Session = Depends(get_db),
        admin: User = Depends(admin_required)
):
    """Получить отзыв по ID для админа"""
    print(f"▶▶▶ get_review_admin: review_id={review_id}")

    review = (
        db.query(Review)
        .options(
            joinedload(Review.order).joinedload(Order.user)
        )
        .filter(Review.id == review_id)
        .first()
    )

    if not review:
        print(f"    → Отзыв {review_id} не найден")
        raise HTTPException(status_code=404, detail="Отзыв не найден")

    return ReviewAdminRead(
        id=review.id,
        order_id=review.order_id,
        rating=review.rating,
        text=review.text,
        email=review.email,
        game_name=review.game_name,
        is_anonymous=review.is_anonymous,
        is_approved=review.is_approved,
        created_at=review.created_at,
        updated_at=review.updated_at,
        order_amount=float(review.order.amount) if review.order else None,
        order_status=review.order.status.value if review.order else None,
        user_id=review.order.user_id if review.order else None,
        username=review.order.user.username if review.order and review.order.user else None
    )


# ------------------------------------------------------------
# 3) Модерация отзыва (одобрение/отклонение)
# ------------------------------------------------------------
@router.post("/{review_id}/moderate", response_model=ReviewAdminRead)
def moderate_review(
        review_id: int,
        action: ReviewModerationAction,
        db: Session = Depends(get_db),
        admin: User = Depends(admin_required)
):
    """Одобрить или отклонить отзыв"""
    print(f"▶▶▶ moderate_review: review_id={review_id}, action={action.action}")

    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        print(f"    → Отзыв {review_id} не найден")
        raise HTTPException(status_code=404, detail="Отзыв не найден")

    if action.action == "approve":
        review.is_approved = True
        print(f"    → Отзыв {review_id} одобрен")

        # TODO: Уведомить пользователя об одобрении отзыва

    elif action.action == "reject":
        # Вместо удаления, помечаем как неодобренный
        review.is_approved = False
        print(f"    → Отзыв {review_id} отклонен. Причина: {action.reason}")

        # TODO: Уведомить пользователя об отклонении с причиной

    else:
        raise HTTPException(status_code=400, detail="Недопустимое действие. Используйте 'approve' или 'reject'")

    db.commit()
    db.refresh(review)

    # Возвращаем обновленный отзыв
    return get_review_admin(review_id, db, admin)


# ------------------------------------------------------------
# 4) Обновление отзыва админом
# ------------------------------------------------------------
@router.put("/{review_id}", response_model=ReviewAdminRead)
def update_review_admin(
        review_id: int,
        update_data: ReviewAdminUpdate,
        db: Session = Depends(get_db),
        admin: User = Depends(admin_required)
):
    """Обновить отзыв админом"""
    print(f"▶▶▶ update_review_admin: review_id={review_id}")

    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        print(f"    → Отзыв {review_id} не найден")
        raise HTTPException(status_code=404, detail="Отзыв не найден")

    # Обновляем поля
    for field, value in update_data.model_dump(exclude_unset=True).items():
        if hasattr(review, field):
            setattr(review, field, value)
            print(f"    → Обновлено {field}: {value}")

    db.commit()
    db.refresh(review)

    return get_review_admin(review_id, db, admin)


# ------------------------------------------------------------
# 5) Удаление отзыва админом
# ------------------------------------------------------------
@router.delete("/{review_id}")
def delete_review_admin(
        review_id: int,
        db: Session = Depends(get_db),
        admin: User = Depends(admin_required)
):
    """Удалить отзыв"""
    print(f"▶▶▶ delete_review_admin: review_id={review_id}")

    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        print(f"    → Отзыв {review_id} не найден")
        raise HTTPException(status_code=404, detail="Отзыв не найден")

    db.delete(review)
    db.commit()

    print(f"    → Отзыв {review_id} удален")
    return {"message": "Отзыв удален"}


# ------------------------------------------------------------
# 6) Статистика модерации
# ------------------------------------------------------------
@router.get("/stats/moderation", response_model=ReviewModerationStats)
def get_moderation_stats(
        db: Session = Depends(get_db),
        admin: User = Depends(admin_required)
):
    """Получить статистику модерации отзывов"""
    print("▶▶▶ get_moderation_stats")

    # Общее количество отзывов
    total_reviews = db.query(Review).count()

    # Одобренные отзывы
    approved_reviews = db.query(Review).filter(Review.is_approved == True).count()

    # Ожидающие модерации
    pending_reviews = db.query(Review).filter(Review.is_approved == False).count()

    # Отзывы за последние 24 часа
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_reviews = db.query(Review).filter(Review.created_at >= yesterday).count()

    stats = ReviewModerationStats(
        pending_reviews=pending_reviews,
        approved_reviews=approved_reviews,
        total_reviews=total_reviews,
        recent_reviews=recent_reviews
    )

    print(f"    → Статистика: всего={total_reviews}, одобрено={approved_reviews}, ожидает={pending_reviews}")
    return stats