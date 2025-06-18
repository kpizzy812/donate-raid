# backend/bot/handlers/support.py - ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ
import sys
from aiogram import Router, F
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.context import FSMContext
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from app.core.database import SessionLocal
from app.models.support import SupportMessage, SupportStatus
from app.models.user import User
from app.core.config import settings
from bot.states.support import SupportReplyState
from bot.instance import bot
from datetime import datetime
from loguru import logger

router = Router()


def get_db() -> Session:
    return SessionLocal()


# 🎛️ Клавиатура для админа с улучшенными опциями
def support_keyboard(user_id: int = None, guest_id: str = None):
    kb = InlineKeyboardBuilder()

    if user_id:
        reply_data = f"support_reply_user_{user_id}"
        close_data = f"support_resolve_user_{user_id}"
        view_data = f"support_view_user_{user_id}"
    else:
        reply_data = f"support_reply_guest_{guest_id}"
        close_data = f"support_resolve_guest_{guest_id}"
        view_data = f"support_view_guest_{guest_id}"

    kb.button(text="✍️ Ответить", callback_data=reply_data)
    kb.button(text="📋 История", callback_data=view_data)
    kb.button(text="✅ Закрыть диалог", callback_data=close_data)
    kb.button(text="🔙 К диалогам", callback_data="support_back")
    kb.adjust(2, 2)

    return kb.as_markup()


# ✅ Уведомление о новом сообщении
async def notify_new_support_message(user_id: int = None, text: str = None, guest_id: str = None):
    logger.info(f"[notify] incoming: user_id={user_id} | guest_id={guest_id} | message='{text}'")

    db = get_db()
    try:
        username = "Гость"
        user_info = ""

        if user_id:
            user = db.query(User).filter_by(id=user_id).first()
            if user:
                username = user.username or user.email or f"ID: {user_id}"
                user_info = f"📧 {user.email}\n💰 Баланс: {user.balance or 0} ₽\n"

        # Считаем количество сообщений в диалоге
        message_count = db.query(SupportMessage).filter(
            and_(
                SupportMessage.user_id == user_id,
                SupportMessage.guest_id == guest_id
            )
        ).count()

        kb = support_keyboard(user_id, guest_id)

        message_text = (
            f"📨 <b>Новое сообщение от {username}</b>\n\n"
            f"{user_info}"
            f"💬 Сообщений в диалоге: {message_count}\n"
            f"🕒 Время: {datetime.now().strftime('%H:%M')}\n\n"
            f"<b>Сообщение:</b>\n{text}"
        )

        if settings.TG_ADMIN_CHAT_IDS:
            admin_ids = [
                int(x.strip())
                for x in settings.TG_ADMIN_CHAT_IDS.split(",")
                if x.strip().isdigit()
            ]

            for admin_id in admin_ids:
                try:
                    await bot.send_message(
                        admin_id,
                        message_text,
                        parse_mode="HTML",
                        reply_markup=kb
                    )
                    logger.info(f"[notify] sent to admin {admin_id}")
                except Exception as e:
                    logger.warning(f"[notify] failed to send to admin {admin_id}: {e}")
    finally:
        db.close()


# ✍️ ИСПРАВЛЕННЫЙ ответ админа с уведомлением фронтенда
@router.message(SupportReplyState.waiting_for_reply)
async def send_reply_support(msg: Message, state: FSMContext):
    data = await state.get_data()
    user_id = data.get("user_id")
    guest_id = data.get("guest_id")

    db = get_db()
    try:
        # Создаем сообщение от админа
        reply = SupportMessage(
            user_id=user_id,
            guest_id=guest_id,
            message=msg.text,
            is_from_user=False,
            status=SupportStatus.in_progress,
            created_at=datetime.utcnow()
        )
        db.add(reply)
        db.commit()
        db.refresh(reply)

        # Отмечаем предыдущие сообщения пользователя как "в обработке"
        db.query(SupportMessage).filter(
            and_(
                SupportMessage.user_id == user_id,
                SupportMessage.guest_id == guest_id,
                SupportMessage.is_from_user == True,
                SupportMessage.status == SupportStatus.new
            )
        ).update({"status": SupportStatus.in_progress})
        db.commit()

        # 🆕 ПОПЫТКА WEBSOCKET УВЕДОМЛЕНИЯ (если доступно)
        try:
            # Пытаемся импортировать и использовать WebSocket
            from app.routers.websocket_support import notify_support_websocket

            message_data = {
                "id": reply.id,
                "message": reply.message,
                "is_from_user": reply.is_from_user,
                "created_at": reply.created_at.isoformat(),
                "status": reply.status.value
            }

            await notify_support_websocket(
                user_id=user_id,
                guest_id=guest_id,
                message_data=message_data
            )
            logger.info("✅ WebSocket уведомление отправлено")
        except ImportError:
            logger.info("❌ WebSocket модуль недоступен")
        except Exception as e:
            logger.error(f"❌ Ошибка WebSocket уведомления: {e}")

        # Сообщаем админу об успешной отправке
        if user_id:
            user = db.query(User).get(user_id)
            username = user.username or user.email or f"ID: {user_id}" if user else f"ID: {user_id}"
            await msg.answer(f"✅ Ответ отправлен пользователю <b>{username}</b>", parse_mode="HTML")
        elif guest_id:
            await msg.answer(f"✅ Ответ отправлен гостю <code>{guest_id[:8]}...</code>", parse_mode="HTML")

    except Exception as e:
        logger.error(f"Ошибка при отправке ответа: {e}")
        await msg.answer(f"❌ Ошибка при отправке ответа: {e}")
    finally:
        db.close()

    await state.clear()


# 💬 Клик "Ответить"
@router.callback_query(F.data.startswith("support_reply_"))
async def start_reply_support(call: CallbackQuery, state: FSMContext):
    data = call.data

    if data.startswith("support_reply_user_"):
        identifier = data.replace("support_reply_user_", "")
        await state.update_data(user_id=int(identifier), guest_id=None)
        await call.message.answer("✍️ Введите ваш ответ пользователю:")
    else:  # support_reply_guest_
        identifier = data.replace("support_reply_guest_", "")
        await state.update_data(user_id=None, guest_id=identifier)
        await call.message.answer("✍️ Введите ваш ответ гостю:")

    await state.set_state(SupportReplyState.waiting_for_reply)
    await call.answer()


# 📋 Просмотр истории диалога
@router.callback_query(F.data.startswith("support_view_"))
async def view_support_dialog(call: CallbackQuery):
    data = call.data
    db = get_db()

    try:
        if data.startswith("support_view_user_"):
            user_id = int(data.replace("support_view_user_", ""))
            messages = db.query(SupportMessage).filter_by(user_id=user_id).order_by(
                SupportMessage.created_at.desc()).limit(10).all()

            user = db.query(User).get(user_id)
            label = user.username or user.email or f"ID: {user_id}" if user else f"ID: {user_id}"
            kb = support_keyboard(user_id=user_id)
        else:
            guest_id = data.replace("support_view_guest_", "")
            messages = db.query(SupportMessage).filter_by(guest_id=guest_id).order_by(
                SupportMessage.created_at.desc()).limit(10).all()
            label = f"Гость: {guest_id[:8]}..."
            kb = support_keyboard(guest_id=guest_id)

        if not messages:
            history = "Диалог пуст."
        else:
            history = ""
            for msg in reversed(messages):  # Показываем в прямом порядке
                sender = "👤 Пользователь" if msg.is_from_user else "🤖 Поддержка"
                time_str = msg.created_at.strftime("%d.%m %H:%M")
                history += f"{sender} ({time_str}):\n{msg.message}\n\n"

        text = f"📋 <b>История диалога с {label}</b>\n\n{history}"

        await call.message.edit_text(text, reply_markup=kb, parse_mode="HTML")
    finally:
        db.close()

    await call.answer()


# ✅ Закрытие диалога
@router.callback_query(F.data.startswith("support_resolve_"))
async def resolve_support_dialog(call: CallbackQuery):
    data = call.data
    db = get_db()

    try:
        if data.startswith("support_resolve_user_"):
            user_id = int(data.replace("support_resolve_user_", ""))

            # Отмечаем все сообщения пользователя как решенные
            updated = db.query(SupportMessage).filter_by(user_id=user_id).update(
                {"status": SupportStatus.resolved}
            )

            user = db.query(User).get(user_id)
            label = user.username or user.email or f"ID: {user_id}" if user else f"ID: {user_id}"
        else:
            guest_id = data.replace("support_resolve_guest_", "")

            # Отмечаем все сообщения гостя как решенные
            updated = db.query(SupportMessage).filter_by(guest_id=guest_id).update(
                {"status": SupportStatus.resolved}
            )

            label = f"Гость: {guest_id[:8]}..."

        db.commit()

        await call.message.edit_text(
            f"✅ <b>Диалог с {label} закрыт</b>\n\n"
            f"Обновлено сообщений: {updated}",
            parse_mode="HTML",
            reply_markup=InlineKeyboardBuilder().button(
                text="🔙 К диалогам", callback_data="support_back"
            ).as_markup()
        )
    finally:
        db.close()

    await call.answer()


# 🔙 Возврат к списку диалогов - ИСПРАВЛЕНО
@router.callback_query(F.data == "support_back")
async def support_back(call: CallbackQuery):
    # ИСПРАВЛЕННЫЙ ИМПОРТ - используем правильное имя функции
    from bot.handlers.admin import admin_support_menu
    await admin_support_menu(call)