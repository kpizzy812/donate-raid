# backend/app/routers/support.py - ИСПРАВЛЕННАЯ ВЕРСИЯ
from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.support import SupportMessage, SupportStatus
from app.services.auth import get_current_user_from_request_sync
from app.models.user import User
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from bot.handlers.support import notify_new_support_message

router = APIRouter()


# Pydantic схемы
class SupportMessageCreate(BaseModel):
    message: str


class SupportMessageRead(BaseModel):
    id: int
    user_id: Optional[int] = None
    guest_id: Optional[str] = None
    message: str
    is_from_user: bool
    created_at: datetime
    status: str

    class Config:
        from_attributes = True


@router.post("/send", response_model=SupportMessageRead)  # ✅ Изменили endpoint на /send
async def create_support_message(
        data: SupportMessageCreate,
        request: Request,
        guest_id: Optional[str] = Query(None),
        db: Session = Depends(get_db),
):
    """Создать сообщение в поддержку"""
    user = None

    # Пытаемся получить авторизованного пользователя
    try:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            user = get_current_user_from_request_sync(request, db)
            print(f"✅ Авторизованный пользователь найден: ID={user.id}, email={user.email}")
        else:
            print("ℹ️ Токен авторизации не найден, работаем как гость")
    except Exception as e:
        print(f"⚠️ Ошибка получения пользователя: {e}")
        user = None  # Продолжаем как гость

    # Создаем сообщение
    message = SupportMessage(
        user_id=user.id if user else None,
        guest_id=guest_id if not user else None,
        message=data.message,
        is_from_user=True,
        status=SupportStatus.new,
        created_at=datetime.utcnow()
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    print(f"📝 Создано сообщение: user_id={message.user_id}, guest_id={message.guest_id}, message='{message.message}'")

    # Уведомляем в Telegram
    try:
        await notify_new_support_message(
            user_id=user.id if user else None,
            text=data.message,
            guest_id=guest_id if not user else None
        )
    except Exception as e:
        print(f"⚠️ Ошибка уведомления в Telegram: {e}")

    return message


@router.get("/my", response_model=list[SupportMessageRead])
def get_my_support_history(
        request: Request,
        db: Session = Depends(get_db),
        guest_id: Optional[str] = Query(None),
):
    """Получить историю сообщений"""

    # Пытаемся получить авторизованного пользователя
    try:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            current_user = get_current_user_from_request_sync(request, db)
            print(f"✅ Загружаем сообщения для авторизованного пользователя: ID={current_user.id}")
            return (
                db.query(SupportMessage)
                .filter_by(user_id=current_user.id)
                .order_by(SupportMessage.created_at.asc())
                .all()
            )
        else:
            print(f"ℹ️ Токен не найден, загружаем сообщения для гостя: guest_id={guest_id}")
    except Exception as e:
        print(f"⚠️ Ошибка получения пользователя: {e}")

    # Если авторизация не удалась, пробуем загрузить по guest_id
    if guest_id:
        return (
            db.query(SupportMessage)
            .filter_by(guest_id=guest_id)
            .order_by(SupportMessage.created_at.asc())
            .all()
        )

    print("❌ Ни токен, ни guest_id не предоставлены")
    return []