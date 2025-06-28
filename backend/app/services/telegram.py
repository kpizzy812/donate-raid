# backend/app/services/telegram.py - ИСПРАВЛЕННАЯ ВЕРСИЯ С КНОПКАМИ ДЛЯ ПЛАТНЫХ ЗАКАЗОВ
import asyncio
import aiohttp
from typing import Optional
from app.core.config import settings
from loguru import logger


class TelegramNotifier:
    """Сервис для отправки уведомлений в Telegram"""

    def __init__(self):
        self.bot_token = settings.TG_BOT_TOKEN
        self.admin_chat_ids = self._parse_admin_chat_ids()
        self.enabled = bool(self.bot_token and self.admin_chat_ids)

    def _parse_admin_chat_ids(self) -> list[str]:
        """Парсит ID чатов администраторов из настроек"""
        if not settings.TG_ADMIN_CHAT_IDS:
            return []
        return [chat_id.strip() for chat_id in settings.TG_ADMIN_CHAT_IDS.split(',')]

    async def send_message(self, text: str, chat_id: Optional[str] = None, reply_markup=None):
        """Отправляет сообщение в Telegram"""
        if not self.enabled:
            logger.warning("Telegram уведомления отключены (не настроен токен или chat_id)")
            return False

        chat_ids = [chat_id] if chat_id else self.admin_chat_ids

        for chat_id in chat_ids:
            try:
                url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
                payload = {
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True
                }

                # Добавляем клавиатуру если есть
                if reply_markup:
                    payload["reply_markup"] = reply_markup
                    logger.info(f"🔍 Отправляем клавиатуру: {reply_markup}")

                logger.info(f"🔍 Полный payload для Telegram API: {payload}")

                async with aiohttp.ClientSession() as session:
                    async with session.post(url, json=payload) as response:
                        response_text = await response.text()
                        if response.status == 200:
                            logger.info(f"Уведомление отправлено в чат {chat_id}")
                        else:
                            logger.error(f"Ошибка отправки в чат {chat_id}: {response.status}")
                            logger.error(f"Ответ Telegram API: {response_text}")

            except Exception as e:
                logger.error(f"Ошибка отправки уведомления в Telegram: {e}")

        return True

    def send_message_sync(self, text: str, chat_id: Optional[str] = None, reply_markup=None):
        """Синхронная версия отправки сообщения"""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # Если цикл уже запущен, создаем задачу
                asyncio.create_task(self.send_message(text, chat_id, reply_markup))
            else:
                # Запускаем в новом цикле
                loop.run_until_complete(self.send_message(text, chat_id, reply_markup))
        except Exception as e:
            logger.error(f"Ошибка синхронной отправки: {e}")


# Глобальный экземпляр
telegram_notifier = TelegramNotifier()


# Функции-хелперы для совместимости с существующим кодом
def notify_order_sync(message: str):
    """Уведомление о новом заказе"""
    telegram_notifier.send_message_sync(message)


def notify_manual_order_sync(message: str, order_id: int = None):
    """Уведомление о ручном заказе с клавиатурой"""
    keyboard = None
    if order_id:
        # Создаем клавиатуру в формате Telegram Bot API
        keyboard = {
            "inline_keyboard": [
                [{"text": "✅ Принять", "callback_data": f"approve_{order_id}"}],
                [{"text": "↩️ Отклонить с возвратом", "callback_data": f"reject_with_refund_{order_id}"}],
                [{"text": "❌ Удалить", "callback_data": f"delete_order_{order_id}"}]
            ]
        }

    telegram_notifier.send_message_sync(message, reply_markup=keyboard)


def notify_payment_sync(message: str, order_id: int = None):
    """Уведомление об оплате с кнопками управления"""
    keyboard = None
    if order_id:
        # Создаем клавиатуру в формате Telegram Bot API
        keyboard = {
            "inline_keyboard": [
                [
                    {"text": "✅ Выполнен", "callback_data": f"paid_complete_{order_id}"},
                    {"text": "💸 Возврат", "callback_data": f"paid_refund_{order_id}"}
                ]
            ]
        }

    telegram_notifier.send_message_sync(message, reply_markup=keyboard)


# Для использования в роутерах
from app.services.telegram import notify_order_sync, notify_manual_order_sync, notify_payment_sync