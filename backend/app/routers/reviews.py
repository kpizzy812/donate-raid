# backend/app/routers/reviews.py - ОСНОВНОЙ РОУТЕР ДЛЯ ОТЗЫВОВ
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from app.core.database import get_db
from app.services.auth import get_current_user, get_current_user_optional
from app.models.review import Review
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewRead, ReviewStats, ReviewFilter
from typing import List, Optional

router = APIRouter()


# ------------------------------------------------------------
# 1) Получение всех одобренных отзывов (публичный эндпоинт)
# ------------------------------------------------------------
@router.get("", response_model=List[ReviewRead])
def get_reviews(
        rating: Optional[int] = Query(None, description="Фильтр по рейтингу (1-5)"),
        game_name: Optional[str] = Query(None, description="Фильтр по названию игры"),
        limit: int = Query(50, le=100, description="Количество отзывов"),
        offset: int = Query(0, description="Смещение для пагинации"),
        db: Session = Depends(get_db)
):
    """Получить список одобренных отзывов"""
    print(f"▶▶▶ get_reviews: rating={rating}, game_name={game_name}, limit={limit}, offset={offset}")

    query = db.query(Review).filter(Review.is_approved == True)

    # Применяем фильтры
    if rating is not None:
        if not 1 <= rating <= 5:
            raise HTTPException(status_code=400, detail="Рейтинг должен быть от 1 до 5")
        query = query.filter(Review.rating == rating)

    if game_name:
        query = query.filter(Review.game_name.ilike(f"%{game_name}%"))

    # Сортировка и пагинация
    reviews = (
        query
        .order_by(desc(Review.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    print(f"    → Найдено {len(reviews)} одобренных отзывов")

    # Преобразуем в схемы с обработкой masked_email
    return [ReviewRead.from_model(review) for review in reviews]


# ------------------------------------------------------------
# 2) Получение статистики отзывов (публичный эндпоинт)
# ------------------------------------------------------------
@router.get("/stats", response_model=ReviewStats)
def get_reviews_stats(db: Session = Depends(get_db)):
    """Получить статистику по отзывам"""
    print("▶▶▶ get_reviews_stats")

    # Общее количество одобренных отзывов
    total_reviews = db.query(Review).filter(Review.is_approved == True).count()

    if total_reviews == 0:
        return ReviewStats(
            total_reviews=0,
            average_rating=0.0,
            rating_distribution={1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        )

    # Средний рейтинг
    avg_rating = db.query(func.avg(Review.rating)).filter(Review.is_approved == True).scalar() or 0.0

    # Распределение по рейтингам
    rating_counts = (
        db.query(Review.rating, func.count(Review.id))
        .filter(Review.is_approved == True)
        .group_by(Review.rating)
        .all()
    )

    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating, count in rating_counts:
        rating_distribution[rating] = count

    print(f"    → Статистика: {total_reviews} отзывов, средний рейтинг {avg_rating:.2f}")

    return ReviewStats(
        total_reviews=total_reviews,
        average_rating=round(avg_rating, 2),
        rating_distribution=rating_distribution
    )


# ------------------------------------------------------------
# 3) Создание отзыва (требует авторизации или email для анонимных)
# ------------------------------------------------------------
@router.post("", response_model=ReviewRead)
def create_review(
        review_data: ReviewCreate,
        db: Session = Depends(get_db),
        current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Создать новый отзыв"""
    print(
        f"▶▶▶ create_review: order_id={review_data.order_id}, user={current_user.id if current_user else 'anonymous'}")

    # Проверяем существование заказа
    order = db.query(Order).options(joinedload(Order.game)).filter(Order.id == review_data.order_id).first()
    if not order:
        print(f"    → Заказ {review_data.order_id} не найден")
        raise HTTPException(status_code=404, detail="Заказ не найден")

    # Проверяем, что заказ завершен
    if order.status != OrderStatus.done:
        print(f"    → Заказ {review_data.order_id} не завершен (статус: {order.status})")
        raise HTTPException(status_code=400, detail="Отзыв можно оставить только после выполнения заказа")

    # Проверяем, что отзыв еще не оставлен
    existing_review = db.query(Review).filter(Review.order_id == review_data.order_id).first()
    if existing_review:
        print(f"    → На заказ {review_data.order_id} уже есть отзыв")
        raise HTTPException(status_code=400, detail="На этот заказ уже оставлен отзыв")

    # Определяем email
    email = None
    is_anonymous = review_data.is_anonymous

    if current_user:
        # Авторизованный пользователь
        # Проверяем права на заказ (если заказ привязан к пользователю)
        if order.user_id and order.user_id != current_user.id:
            print(f"    → Пользователь {current_user.id} пытается оставить отзыв на чужой заказ {review_data.order_id}")
            raise HTTPException(status_code=403, detail="Вы можете оставлять отзывы только на свои заказы")

        email = current_user.email
        if not email and not review_data.email:
            raise HTTPException(status_code=400, detail="Email не указан в профиле, укажите в отзыве")

        # Используем email из профиля или из отзыва
        email = email or review_data.email

    else:
        # Анонимный пользователь
        if not review_data.email:
            raise HTTPException(status_code=400, detail="Для анонимного отзыва требуется указать email")

        email = review_data.email
        is_anonymous = True

    # Создаем отзыв
    new_review = Review(
        order_id=review_data.order_id,
        rating=review_data.rating,
        text=review_data.text,
        email=str(email),
        game_name=order.game.name,
        is_anonymous=is_anonymous,
        is_approved=False  # По умолчанию требует модерации
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    print(f"    → Отзыв создан: id={new_review.id}, ожидает модерации")

    # Отправляем уведомление в Telegram админам о новом отзыве
    try:
        from bot.notify import notify_new_review_sync

        # Определяем информацию о пользователе для уведомления
        user_info = "👻 Анонимный пользователь"
        if current_user:
            user_info = f"👤 {current_user.username or 'Без имени'} (ID: {current_user.id})"

        review_notification_data = {
            'review_id': new_review.id,
            'rating': new_review.rating,
            'text': new_review.text,
            'game_name': new_review.game_name,
            'masked_email': new_review.get_masked_email(),
            'user_info': user_info
        }

        notify_new_review_sync(review_notification_data)
        print(f"    → Уведомление о новом отзыве #{new_review.id} отправлено в Telegram")

    except Exception as e:
        print(f"    → Ошибка отправки уведомления в Telegram: {e}")

    return ReviewRead.from_model(new_review)


# ------------------------------------------------------------
# 4) Получение отзыва по заказу (для проверки, оставлен ли отзыв)
# ------------------------------------------------------------
@router.get("/order/{order_id}", response_model=Optional[ReviewRead])
def get_review_by_order(
        order_id: int,
        db: Session = Depends(get_db),
        current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Получить отзыв по ID заказа"""
    print(f"▶▶▶ get_review_by_order: order_id={order_id}")

    review = db.query(Review).filter(Review.order_id == order_id).first()

    if not review:
        print(f"    → Отзыв на заказ {order_id} не найден")
        return None

    # Если отзыв не одобрен, показываем только автору
    if not review.is_approved:
        if not current_user:
            print(f"    → Отзыв {review.id} не одобрен и пользователь не авторизован")
            return None

        # Проверяем права доступа к заказу
        order = db.query(Order).filter(Order.id == order_id).first()
        if order and order.user_id != current_user.id:
            print(f"    → Пользователь {current_user.id} пытается посмотреть чужой неодобренный отзыв")
            return None

    print(f"    → Отзыв найден: id={review.id}, одобрен={review.is_approved}")
    return ReviewRead.from_model(review)


# ------------------------------------------------------------
# 5) Проверка возможности оставить отзыв
# ------------------------------------------------------------
@router.get("/can-review/{order_id}")
def can_leave_review(
        order_id: int,
        db: Session = Depends(get_db),
        current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Проверить, можно ли оставить отзыв на заказ"""
    print(f"▶▶▶ can_leave_review: order_id={order_id}")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    # Проверяем права доступа для авторизованных пользователей
    if current_user and order.user_id and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа к этому заказу")

    can_review = order.can_leave_review()
    reason = None

    if not can_review:
        if order.status != OrderStatus.done:
            reason = f"Заказ не завершен (статус: {order.status.value})"
        elif order.review:
            reason = "Отзыв уже оставлен"
        else:
            reason = "Неизвестная причина"

    result = {
        "can_review": can_review,
        "order_status": order.status.value,
        "has_review": order.review is not None
    }

    if reason:
        result["reason"] = reason

    print(f"    → Можно оставить отзыв: {can_review}, причина: {reason}")
    return result