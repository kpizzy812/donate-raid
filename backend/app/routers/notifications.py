# backend/app/routers/notifications.py - НОВЫЙ ФАЙЛ
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from app.core.database import get_db
from app.models.support import SupportMessage, SupportStatus
from app.models.order import Order, OrderStatus
from app.services.auth import get_current_user_optional
from app.models.user import User
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel

router = APIRouter()


class NotificationResponse(BaseModel):
    type: str  # 'support_reply', 'order_update', 'system'
    title: str
    message: str
    created_at: str
    read: bool = False
    data: Optional[dict] = None


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
        guest_id: Optional[str] = Query(None),
        limit: int = Query(10, le=50),
        db: Session = Depends(get_db),
        current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Получить уведомления для пользователя или гостя"""

    notifications = []

    # Для авторизованных пользователей
    if current_user:
        # Проверяем новые ответы от поддержки
        support_replies = (
            db.query(SupportMessage)
            .filter(
                and_(
                    SupportMessage.user_id == current_user.id,
                    SupportMessage.is_from_user == False,
                    SupportMessage.created_at >= datetime.utcnow() - timedelta(hours=24)
                )
            )
            .order_by(desc(SupportMessage.created_at))
            .limit(limit)
            .all()
        )

        for reply in support_replies:
            notifications.append(NotificationResponse(
                type="support_reply",
                title="Ответ от поддержки",
                message=reply.message[:100] + "..." if len(reply.message) > 100 else reply.message,
                created_at=reply.created_at.isoformat(),
                data={"message_id": reply.id}
            ))

        # Проверяем обновления заказов
        order_updates = (
            db.query(Order)
            .filter(
                and_(
                    Order.user_id == current_user.id,
                    Order.updated_at >= datetime.utcnow() - timedelta(hours=24),
                    Order.status.in_([OrderStatus.done, OrderStatus.canceled])
                )
            )
            .order_by(desc(Order.updated_at))
            .limit(limit)
            .all()
        )

        for order in order_updates:
            status_text = "выполнен" if order.status == OrderStatus.done else "отменен"
            notifications.append(NotificationResponse(
                type="order_update",
                title=f"Заказ #{order.id} {status_text}",
                message=f"Ваш заказ на сумму {order.amount} {order.currency} {status_text}",
                created_at=order.updated_at.isoformat() if order.updated_at else order.created_at.isoformat(),
                data={"order_id": order.id, "status": order.status}
            ))

    # Для гостей - только ответы поддержки
    elif guest_id:
        support_replies = (
            db.query(SupportMessage)
            .filter(
                and_(
                    SupportMessage.guest_id == guest_id,
                    SupportMessage.is_from_user == False,
                    SupportMessage.created_at >= datetime.utcnow() - timedelta(hours=24)
                )
            )
            .order_by(desc(SupportMessage.created_at))
            .limit(limit)
            .all()
        )

        for reply in support_replies:
            notifications.append(NotificationResponse(
                type="support_reply",
                title="Ответ от поддержки",
                message=reply.message[:100] + "..." if len(reply.message) > 100 else reply.message,
                created_at=reply.created_at.isoformat(),
                data={"message_id": reply.id}
            ))

    # Сортируем по времени создания
    notifications.sort(key=lambda x: x.created_at, reverse=True)

    return notifications[:limit]


@router.get("/count")
def get_notification_count(
        guest_id: Optional[str] = Query(None),
        db: Session = Depends(get_db),
        current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Получить количество непрочитанных уведомлений"""

    count = 0

    # Для авторизованных пользователей
    if current_user:
        # Непрочитанные ответы поддержки
        support_count = (
            db.query(SupportMessage)
            .filter(
                and_(
                    SupportMessage.user_id == current_user.id,
                    SupportMessage.is_from_user == False,
                    SupportMessage.status == SupportStatus.in_progress,
                    SupportMessage.created_at >= datetime.utcnow() - timedelta(hours=24)
                )
            )
            .count()
        )

        # Обновления заказов
        order_count = (
            db.query(Order)
            .filter(
                and_(
                    Order.user_id == current_user.id,
                    Order.updated_at >= datetime.utcnow() - timedelta(hours=24),
                    Order.status.in_([OrderStatus.done, OrderStatus.canceled])
                )
            )
            .count()
        )

        count = support_count + order_count

    # Для гостей
    elif guest_id:
        support_count = (
            db.query(SupportMessage)
            .filter(
                and_(
                    SupportMessage.guest_id == guest_id,
                    SupportMessage.is_from_user == False,
                    SupportMessage.status == SupportStatus.in_progress,
                    SupportMessage.created_at >= datetime.utcnow() - timedelta(hours=24)
                )
            )
            .count()
        )

        count = support_count

    return {"count": count}