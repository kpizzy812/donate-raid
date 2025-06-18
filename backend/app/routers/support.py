# backend/app/routers/support.py - ПОЛНАЯ ВЕРСИЯ
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

@router.post("/send", response_model=SupportMessageRead)
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
async def get_my_support_messages(
        request: Request,
        guest_id: Optional[str] = Query(None),
        db: Session = Depends(get_db)
):
    """Получить мои сообщения поддержки"""
    user = None

    # Пытаемся получить авторизованного пользователя
    try:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            user = get_current_user_from_request_sync(request, db)
    except Exception:
        user = None

    # Определяем фильтр для запроса
    if user:
        # Для авторизованных пользователей ищем по user_id
        messages = db.query(SupportMessage).filter(
            SupportMessage.user_id == user.id
        ).order_by(SupportMessage.created_at.asc()).all()
    elif guest_id:
        # Для гостей ищем по guest_id
        messages = db.query(SupportMessage).filter(
            SupportMessage.guest_id == guest_id
        ).order_by(SupportMessage.created_at.asc()).all()
    else:
        # Если нет ни user_id, ни guest_id - возвращаем пустой список
        messages = []

    return messages