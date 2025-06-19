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
from loguru import logger

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
            logger.info(f"✅ Авторизованный пользователь найден: ID={user.id}, email={user.email}")
        else:
            logger.info("ℹ️ Токен авторизации не найден, работаем как гость")
    except Exception as e:
        logger.warning(f"⚠️ Ошибка получения пользователя: {e}")
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

    logger.info(f"📝 Создано сообщение: user_id={message.user_id}, guest_id={message.guest_id}, message='{message.message}'")

    # 🆕 ДОБАВЛЯЕМ WEBSOCKET УВЕДОМЛЕНИЕ ДЛЯ ПОЛЬЗОВАТЕЛЯ
    try:
        from app.routers.websocket_support import notify_support_websocket

        message_data = {
            "id": message.id,
            "message": message.message,
            "is_from_user": message.is_from_user,
            "created_at": message.created_at.isoformat(),
            "status": message.status.value
        }

        # Уведомляем через WebSocket (для real-time обновления в браузере)
        await notify_support_websocket(
            user_id=user.id if user else None,
            guest_id=guest_id if not user else None,
            message_data=message_data
        )
        logger.info("✅ WebSocket уведомление отправлено")
    except Exception as e:
        logger.error(f"❌ Ошибка WebSocket уведомления: {e}")

    # Уведомляем админов в Telegram
    try:
        await notify_new_support_message(
            user_id=user.id if user else None,
            text=data.message,
            guest_id=guest_id if not user else None
        )
        logger.info("✅ Telegram уведомление отправлено")
    except Exception as e:
        logger.warning(f"⚠️ Ошибка уведомления в Telegram: {e}")

    return message


@router.get("/my")
async def get_my_support_messages(
        request: Request,
        guest_id: Optional[str] = Query(None),
        db: Session = Depends(get_db),
):
    """Получить сообщения поддержки текущего пользователя"""
    user = None

    # Пытаемся получить авторизованного пользователя
    try:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            user = get_current_user_from_request_sync(request, db)
    except Exception:
        pass

    if user:
        # Для авторизованного пользователя
        messages = db.query(SupportMessage).filter_by(user_id=user.id).order_by(SupportMessage.created_at).all()
    elif guest_id:
        # Для гостя
        messages = db.query(SupportMessage).filter_by(guest_id=guest_id).order_by(SupportMessage.created_at).all()
    else:
        return []

    return messages