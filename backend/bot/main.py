# backend/bot/main.py - УЛУЧШЕННАЯ ВЕРСИЯ
import asyncio
import logging
from aiogram import Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage

from bot.instance import bot
from bot.handlers import router as main_router  # Используем уже подключенный router
from bot.config import ADMIN_CHAT_IDS

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    """Запуск бота"""
    dp = Dispatcher(storage=MemoryStorage())

    # Регистрируем главный роутер (он уже включает admin, support, manual_orders)
    dp.include_router(main_router)

    # Уведомляем админов о запуске
    for admin_id in ADMIN_CHAT_IDS:
        try:
            await bot.send_message(
                admin_id,
                "🤖 <b>Бот запущен и готов к работе!</b>\n\n"
                "Доступные команды:\n"
                "• /admin - панель администратора\n"
                "• /support - активные диалоги поддержки\n"
                "• /start - общая информация",
                parse_mode="HTML"
            )
        except Exception as e:
            logger.error(f"Не удалось отправить уведомление админу {admin_id}: {e}")

    logger.info("Bot started successfully")

    # Запускаем поллинг
    try:
        await dp.start_polling(bot)
    finally:
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())