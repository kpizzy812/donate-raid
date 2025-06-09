from aiogram import Router, F
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.context import FSMContext
from aiogram.utils.keyboard import InlineKeyboardBuilder
from app.core.database import SessionLocal
from app.models.support import SupportMessage
from bot.states.support import SupportReplyState
from sqlalchemy.orm import Session
from datetime import datetime
from bot.instance import bot
from typing import Optional
from app.core.config import settings
from app.core.logger import logger
import sys
from app.models.user import User

router = Router()

def get_db() -> Session:
    return SessionLocal()

# 👤 Кнопка "Ответить"
def support_keyboard(user_id: Optional[int], guest_id: Optional[str] = None):
    # Отладочный print в stderr, чтобы точно увидеть вызов
    print(f">>> support_keyboard вызван с: user_id={user_id}, guest_id={guest_id}", file=sys.stderr, flush=True)
    logger.info(f"[support_keyboard] user_id={user_id} | guest_id={guest_id}")

    kb = InlineKeyboardBuilder()

    if user_id is not None:
        callback_data = f"support_reply_user_{user_id}"
        close_data = f"support_resolve_user_{user_id}"
    elif guest_id:
        callback_data = f"support_reply_guest_{guest_id}"
        close_data = f"support_resolve_guest_{guest_id}"
    else:
        # fallback — нет данных, возвращаем None
        print(">>> support_keyboard: ни user_id, ни guest_id нет, возвращаю None", file=sys.stderr, flush=True)
        return None

    # Дополнительный print, чтобы убедиться в длине callback_data
    print(f">>> support_keyboard: callback_data='{callback_data}' (len={len(callback_data)}), close_data='{close_data}' (len={len(close_data)})", file=sys.stderr, flush=True)

    kb.button(text="✉️ Ответить", callback_data=callback_data)
    kb.button(text="✅ Закрыть", callback_data=close_data)
    kb.adjust(1)
    markup = kb.as_markup()
    print(f">>> support_keyboard возвращает InlineKeyboardMarkup: {markup}", file=sys.stderr, flush=True)
    return markup


# ✅ Команда от FastAPI для вызова из notify
async def notify_new_support_message(user_id: Optional[int], text: str, guest_id: Optional[str] = None):
    # Печатаем входные параметры
    print(f">>> notify_new_support_message вызван с: user_id={user_id}, guest_id={guest_id}, text='{text}'", file=sys.stderr, flush=True)
    logger.info(f"[notify] incoming: user_id={user_id} | guest_id={guest_id} | message='{text}'")

    db = get_db()
    username = "Аноним"

    if user_id:
        user = db.query(User).filter_by(id=user_id).first()
        username = user.username or str(user_id)

    kb = support_keyboard(user_id, guest_id)
    print(f">>> notify_new_support_message: support_keyboard вернул: {kb}", file=sys.stderr, flush=True)
    logger.info(f"[notify] reply_markup: {kb}")

    if settings.TG_ADMIN_CHAT_IDS:
        admin_ids = [
            int(x.strip())
            for x in settings.TG_ADMIN_CHAT_IDS.split(",")
            if x.strip().isdigit()
        ]
        print(f">>> notify_new_support_message: рассчитанные admin_ids = {admin_ids}", file=sys.stderr, flush=True)
        for admin_id in admin_ids:
            try:
                await bot.send_message(
                    admin_id,
                    f"📨 Новое сообщение от <b>{username}</b>:\n\n{text}",
                    parse_mode="HTML",
                    reply_markup=kb if kb else None
                )
                print(f">>> notify_new_support_message: отправил админу {admin_id}", file=sys.stderr, flush=True)
            except Exception as e:
                print(f">>> notify_new_support_message: не смог отправить админу {admin_id}: {e}", file=sys.stderr, flush=True)
                logger.error(f"[notify] не удалось отправить админу {admin_id}: {e}")
    else:
        print(">>> notify_new_support_message: TG_ADMIN_CHAT_IDS пустой или не задан", file=sys.stderr, flush=True)
        logger.warning("[notify] TG_ADMIN_CHAT_IDS пустой, никто не получит сообщение")

# 💬 Клик "Ответить"
@router.callback_query(F.data.startswith("support_reply_"))
async def start_reply_support(call: CallbackQuery, state: FSMContext):
    data = call.data

    if data.startswith("support_reply_user_"):
        identifier = data.replace("support_reply_user_", "")
        await state.update_data(user_id=int(identifier), guest_id=None)
    else:  # support_reply_guest_
        identifier = data.replace("support_reply_guest_", "")
        await state.update_data(user_id=None, guest_id=identifier)

    await state.set_state(SupportReplyState.waiting_for_reply)
    await call.message.answer("✍️ Введите ваш ответ пользователю:")
    await call.answer()



# ✍️ Ответ админа
@router.message(SupportReplyState.waiting_for_reply)
async def send_reply_support(msg: Message, state: FSMContext):
    data = await state.get_data()
    user_id = data.get("user_id")
    guest_id = data.get("guest_id")

    db = get_db()

    reply = SupportMessage(
        user_id=user_id,
        guest_id=guest_id,
        message=msg.text,
        is_from_user=False,
        created_at=datetime.utcnow()
    )
    db.add(reply)
    db.commit()

    try:
        if user_id:
            await bot.send_message(user_id, f"👨‍💼 Ответ поддержки:\n\n{msg.text}")
        await msg.answer("✅ Ответ отправлен")
    except Exception as e:
        await msg.answer(f"⚠️ Не удалось отправить сообщение: {e}")

    await state.clear()

@router.message(F.text == "/support")
async def list_support_dialogs(msg: Message):
    db = get_db()

    users_with_dialogs = (
        db.query(SupportMessage.user_id, SupportMessage.guest_id)
        .distinct()
        .all()
    )

    kb = InlineKeyboardBuilder()

    for user_id, guest_id in users_with_dialogs:
        last = (
            db.query(SupportMessage)
            .filter_by(user_id=user_id, guest_id=guest_id)
            .order_by(SupportMessage.created_at.desc())
            .first()
        )
        label = user_id or guest_id or "?"
        text = f"👤 {label}: {last.message[:40]}..."
        if user_id:
            callback_data = f"support_view_user_{user_id}"
        else:
            callback_data = f"support_view_guest_{guest_id}"

        kb.button(text=text, callback_data=callback_data)

    kb.adjust(1)
    await msg.answer("📂 Открытые диалоги поддержки:", reply_markup=kb.as_markup())

@router.callback_query(F.data.startswith("support_view_"))
async def view_support_dialog(call: CallbackQuery):
    data = call.data
    db = get_db()

    if data.startswith("support_view_user_"):
        user_id = int(data.replace("support_view_user_", ""))
        messages = (
            db.query(SupportMessage)
            .filter_by(user_id=user_id)
            .order_by(SupportMessage.created_at.asc())
            .all()
        )
        label = str(user_id)
        kb = support_keyboard(user_id=user_id)
    else:
        guest_id = data.replace("support_view_guest_", "")
        messages = (
            db.query(SupportMessage)
            .filter_by(guest_id=guest_id)
            .order_by(SupportMessage.created_at.asc())
            .all()
        )
        label = guest_id
        kb = support_keyboard(user_id=None, guest_id=guest_id)

    history = ""
    for msg in messages:
        prefix = "👤" if msg.is_from_user else "👨‍💼"
        history += f"{prefix} {msg.message}\n"

    if not history:
        history = "Диалог пуст."

    await call.message.answer(f"📨 Диалог с пользователем {label}:\n\n{history}", reply_markup=kb)
    await call.answer()

@router.callback_query(F.data.startswith("support_resolve_"))
async def close_support_dialog(call: CallbackQuery):
    data = call.data
    db = get_db()

    if data.startswith("support_resolve_user_"):
        user_id = int(data.replace("support_resolve_user_", ""))
        db.query(SupportMessage).filter_by(user_id=user_id).update({"status": "resolved"})
        label = str(user_id)
    else:
        guest_id = data.replace("support_resolve_guest_", "")
        db.query(SupportMessage).filter_by(guest_id=guest_id).update({"status": "resolved"})
        label = guest_id

    db.commit()
    await call.message.answer(f"✅ Диалог с пользователем {label} закрыт.")
    await call.answer()

@router.callback_query(F.data == "support_back")
async def back_to_dialogs(call: CallbackQuery):
    db = get_db()

    users_with_dialogs = (
        db.query(SupportMessage.user_id, SupportMessage.guest_id)
        .filter(SupportMessage.status != "resolved")
        .distinct()
        .all()
    )

    kb = InlineKeyboardBuilder()

    for user_id, guest_id in users_with_dialogs:
        last = (
            db.query(SupportMessage)
            .filter_by(user_id=user_id, guest_id=guest_id)
            .order_by(SupportMessage.created_at.desc())
            .first()
        )
        has_unread = last.is_from_user and last.status != "resolved"
        prefix = "❗️ " if has_unread else ""
        label = user_id or guest_id or "?"
        text = f"{prefix}👤 {label}: {last.message[:40]}..."
        if user_id:
            callback_data = f"support_view_user_{user_id}"
        else:
            callback_data = f"support_view_guest_{guest_id}"

        kb.button(text=text, callback_data=callback_data)

    kb.adjust(1)
    await call.message.edit_text("📂 Открытые диалоги поддержки:", reply_markup=kb.as_markup())
    await call.answer()
