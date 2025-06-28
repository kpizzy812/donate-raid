# backend/app/routers/support.py - ИСПРАВЛЕННАЯ ВЕРСИЯ
from fastapi import APIRouter, Depends, Request, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.support import SupportMessage, SupportStatus
from app.services.auth import get_current_user_from_request_sync
from app.models.user import User
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from loguru import logger

router = APIRouter()


# Pydantic схемы
class SupportMessageCreate(BaseModel):
    message: str
    guest_id: Optional[str] = None


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


# ИСПРАВЛЕННАЯ функция уведомления - запускается в фоне
async def send_telegram_notification(user_id: int = None, text: str = None, guest_id: str = None):
    """Фоновая задача для отправки уведомления в Telegram"""
    try:
        from bot.handlers.support import notify_new_support_message
        await notify_new_support_message(
            user_id=user_id,
            text=text,
            guest_id=guest_id
        )
        logger.info("✅ Telegram уведомление отправлено")
    except Exception as e:
        logger.warning(f"⚠️ Ошибка уведомления в Telegram: {e}")


@router.post("/send", response_model=SupportMessageRead)
async def create_support_message(
        data: SupportMessageCreate,
        background_tasks: BackgroundTasks,  # ИСПРАВЛЕНО: добавлен BackgroundTasks
        request: Request,
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

    # Определяем guest_id
    guest_id = None
    if not user:
        guest_id = data.guest_id
        if not guest_id:
            # Генерируем guest_id если не передан
            import uuid
            guest_id = str(uuid.uuid4())[:8]
            logger.info(f"🆔 Сгенерирован новый guest_id: {guest_id}")

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

    logger.info(
        f"📝 Создано сообщение: user_id={message.user_id}, guest_id={message.guest_id}, message='{message.message}'")

    # ИСПРАВЛЕНО: запускаем уведомление в фоне
    background_tasks.add_task(
        send_telegram_notification,
        user_id=user.id if user else None,
        text=data.message,
        guest_id=guest_id if not user else None
    )

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


# ДОБАВЛЕННЫЙ endpoint для совместимости
@router.post("/messages")
async def get_support_messages_post(
        data: dict,
        request: Request,
        db: Session = Depends(get_db),
):
    """Получить сообщения поддержки (POST версия для совместимости)"""
    guest_id = data.get('guest_id')

    # Переадресовываем на GET endpoint
    return await get_my_support_messages(request, guest_id, db)