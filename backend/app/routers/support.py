# backend/app/routers/support.py - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ
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
        background_tasks: BackgroundTasks,
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
        user = None

    # Определяем guest_id
    guest_id = None
    if not user:
        if not data.guest_id:
            logger.error("❌ Для неавторизованного пользователя требуется guest_id")
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="guest_id is required for unauthenticated users")
        guest_id = data.guest_id
        logger.info(f"🆔 Используем guest_id: {guest_id}")

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
        f"📝 Создано сообщение: ID={message.id}, user_id={message.user_id}, guest_id={message.guest_id}, message='{message.message}'")

    # Запускаем уведомление в фоне
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
            logger.info(f"📨 Загружаем сообщения для авторизованного пользователя ID={user.id}")
    except Exception as e:
        logger.info(f"ℹ️ Не удалось получить пользователя: {e}")
        pass

    messages = []

    if user:
        # Для авторизованного пользователя
        messages = db.query(SupportMessage).filter_by(user_id=user.id).order_by(SupportMessage.created_at).all()
        logger.info(f"📨 Найдено {len(messages)} сообщений для пользователя ID={user.id}")
    elif guest_id:
        # Для гостя
        messages = db.query(SupportMessage).filter_by(guest_id=guest_id).order_by(SupportMessage.created_at).all()
        logger.info(f"📨 Найдено {len(messages)} сообщений для гостя {guest_id}")
    else:
        logger.warning("⚠️ Не удалось определить пользователя или guest_id")
        return []

    # Преобразуем в список словарей для лучшей совместимости
    result = []
    for msg in messages:
        result.append({
            "id": msg.id,
            "user_id": msg.user_id,
            "guest_id": msg.guest_id,
            "message": msg.message,
            "is_from_user": msg.is_from_user,
            "created_at": msg.created_at.isoformat(),
            "status": msg.status.value if hasattr(msg.status, 'value') else str(msg.status)
        })

    logger.info(f"📤 Возвращаем {len(result)} сообщений")
    return result


# ДОБАВЛЕННЫЙ endpoint для совместимости (если используется где-то)
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