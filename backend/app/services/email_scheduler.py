# backend/app/services/email_scheduler.py
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from loguru import logger

from backend.app.services.email_receiver import email_receiver


class EmailScheduler:
    """Планировщик для проверки почты"""

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.is_running = False

    def start(self):
        """Запускает планировщик"""
        if self.is_running:
            return

        # Проверяем почту каждые 2 минуты
        self.scheduler.add_job(
            email_receiver.check_new_emails,
            'interval',
            minutes=2,
            id='check_emails',
            replace_existing=True
        )

        # Проверяем сразу при запуске
        self.scheduler.add_job(
            email_receiver.check_new_emails,
            'date',
            id='check_emails_startup',
            replace_existing=True
        )

        self.scheduler.start()
        self.is_running = True
        logger.info("📧 Email планировщик запущен (проверка каждые 2 минуты)")

    def stop(self):
        """Останавливает планировщик"""
        if self.scheduler.running:
            self.scheduler.shutdown()
        self.is_running = False
        logger.info("📧 Email планировщик остановлен")


# Создаем экземпляр планировщика
email_scheduler = EmailScheduler()