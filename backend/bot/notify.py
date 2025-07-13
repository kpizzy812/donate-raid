import asyncio
import threading
from aiogram.types import Message
from aiogram.utils.keyboard import InlineKeyboardBuilder
from bot.config import ADMIN_CHAT_IDS
from .handlers.manual_orders import manual_order_keyboard
from bot.instance import bot


async def send_to_admins(text: str, keyboard=None):
    for chat_id in ADMIN_CHAT_IDS:
        try:
            await bot.send_message(chat_id, text, reply_markup=keyboard, parse_mode="HTML")
        except Exception as e:
            print(f"[ERROR] Can't send to {chat_id}: {e}")


def notify_manual_order_sync(text: str, order_id: int = None):
    """Синхронная версия уведомления о ручном заказе"""
    kb = manual_order_keyboard(order_id) if order_id else None

    def run_notification():
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(send_to_admins(text, kb))
        except Exception as e:
            print(f"[ERROR] Notification failed: {e}")
        finally:
            try:
                loop.close()
            except:
                pass

    threading.Thread(target=run_notification, daemon=True).start()


def review_moderation_keyboard(review_id: int):
    """Клавиатура для модерации отзыва"""
    kb = InlineKeyboardBuilder()
    kb.button(text="✅ Одобрить", callback_data=f"review_approve_{review_id}")
    kb.button(text="❌ Отклонить", callback_data=f"review_reject_{review_id}")
    kb.button(text="📝 Все отзывы", callback_data="admin_reviews")
    kb.adjust(2, 1)
    return kb.as_markup()


def notify_new_review_sync(review_data: dict):
    """Синхронная версия уведомления о новом отзыве"""

    # Извлекаем данные
    review_id = review_data.get('review_id')
    rating = review_data.get('rating')
    text = review_data.get('text', '')
    game_name = review_data.get('game_name', 'Неизвестная игра')
    email = review_data.get('masked_email', 'Нет email')
    user_info = review_data.get('user_info', 'Анонимный пользователь')

    # Звездочки рейтинга
    stars = "⭐" * rating + "☆" * (5 - rating)

    # Обрезаем длинный текст отзыва
    review_text_short = text[:200] + "..." if len(text) > 200 else text

    # Формируем сообщение
    message = (
        f"📝 <b>Новый отзыв на модерации!</b>\n\n"
        f"🎮 Игра: <b>{game_name}</b>\n"
        f"👤 От: {user_info}\n"
        f"📧 Email: <code>{email}</code>\n\n"
        f"⭐ Рейтинг: {stars} ({rating}/5)\n\n"
        f"💬 <b>Текст отзыва:</b>\n"
        f"<i>{review_text_short}</i>"
    )

    # Клавиатура для модерации
    kb = review_moderation_keyboard(review_id)

    def run_notification():
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(send_to_admins(message, kb))
            print(f"✅ [REVIEW] Уведомление о новом отзыве #{review_id} отправлено")
        except Exception as e:
            print(f"[ERROR] Review notification failed: {e}")
        finally:
            try:
                loop.close()
            except:
                pass

    threading.Thread(target=run_notification, daemon=True).start()