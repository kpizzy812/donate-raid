# backend/app/services/email_receiver.py
import asyncio
import email
import re
from datetime import datetime
from email.header import decode_header
from typing import Optional

import imapclient
from loguru import logger
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.support import SupportMessage, SupportStatus
from app.models.user import User


class EmailReceiver:
    """Сервис для получения входящих писем и создания тикетов поддержки"""

    def __init__(self):
        self.imap_server = "mail.donateraid.ru"
        self.username = "support@donateraid.ru"
        self.password = settings.MAIL_PASSWORD  # Пароль из .env
        self.port = 993  # IMAPS

    def decode_mime_words(self, s):
        """Декодирует MIME заголовки"""
        try:
            decoded_words = decode_header(s)
            return ''.join([
                word.decode(encoding or 'utf-8') if isinstance(word, bytes) else word
                for word, encoding in decoded_words
            ])
        except:
            return s

    def extract_email_from_header(self, header: str) -> Optional[str]:
        """Извлекает email из заголовка From"""
        if not header:
            return None

        # Ищем email в угловых скобках
        match = re.search(r'<([^>]+@[^>]+)>', header)
        if match:
            return match.group(1).strip().lower()

        # Если нет скобок, проверяем что это просто email
        if '@' in header and ' ' not in header.strip():
            return header.strip().lower()

        return None

    def get_email_body(self, msg) -> str:
        """Извлекает текст письма"""
        body = ""

        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))

                # Ищем текстовые части
                if content_type == "text/plain" and "attachment" not in content_disposition:
                    try:
                        charset = part.get_content_charset() or 'utf-8'
                        part_body = part.get_payload(decode=True).decode(charset)
                        body += part_body + "\n"
                    except:
                        continue

                elif content_type == "text/html" and not body and "attachment" not in content_disposition:
                    # Если нет plain text, берем HTML (можно позже конвертировать)
                    try:
                        charset = part.get_content_charset() or 'utf-8'
                        html_body = part.get_payload(decode=True).decode(charset)
                        # Простейшая очистка HTML (можно улучшить)
                        import re
                        body = re.sub('<[^<]+?>', '', html_body)
                    except:
                        continue
        else:
            # Простое письмо
            try:
                charset = msg.get_content_charset() or 'utf-8'
                body = msg.get_payload(decode=True).decode(charset)
            except:
                body = str(msg.get_payload())

        return body.strip()

    async def check_new_emails(self) -> None:
        """Проверяет новые письма и создает тикеты"""
        try:
            logger.info("🔍 Проверяем новые письма...")

            # Подключаемся к IMAP
            with imapclient.IMAPClient(self.imap_server, ssl=True, port=self.port) as client:
                client.login(self.username, self.password)
                client.select_folder('INBOX')

                # Ищем непрочитанные письма
                messages = client.search('UNSEEN')
                logger.info(f"📧 Найдено {len(messages)} новых писем")

                for msg_id in messages:
                    try:
                        await self.process_email(client, msg_id)
                        # Помечаем как прочитанное
                        client.set_flags(msg_id, ['\\Seen'])

                    except Exception as e:
                        logger.error(f"❌ Ошибка обработки письма {msg_id}: {e}")

        except Exception as e:
            logger.error(f"❌ Ошибка подключения к IMAP: {e}")

    async def process_email(self, client, msg_id) -> None:
        """Обрабатывает одно письмо"""
        # Получаем письмо
        response = client.fetch(msg_id, ['RFC822'])
        raw_email = response[msg_id][b'RFC822']

        # Парсим письмо
        msg = email.message_from_bytes(raw_email)

        # Извлекаем данные
        sender = self.decode_mime_words(msg.get('From', ''))
        subject = self.decode_mime_words(msg.get('Subject', 'Без темы'))
        body = self.get_email_body(msg)

        # Извлекаем email отправителя
        sender_email = self.extract_email_from_header(sender)

        if not sender_email:
            logger.warning(f"⚠️ Не удалось извлечь email из заголовка: {sender}")
            return

        logger.info(f"📨 Обрабатываем письмо от {sender_email}: {subject}")

        # Создаем тикет в базе данных
        await self.create_support_ticket(sender_email, subject, body, sender)

    async def create_support_ticket(self, sender_email: str, subject: str, body: str, sender_name: str) -> None:
        """Создает тикет поддержки из письма"""

        # Получаем сессию БД (синхронно)
        db = next(get_db())

        try:
            # Проверяем есть ли пользователь с таким email
            user = db.query(User).filter(User.email == sender_email).first()

            # Формируем сообщение
            message_text = f"📧 **Письмо от {sender_name}**\n"
            message_text += f"**Тема:** {subject}\n\n"
            message_text += f"**Сообщение:**\n{body}"

            # Создаем тикет поддержки
            support_message = SupportMessage(
                user_id=user.id if user else None,
                guest_id=sender_email if not user else None,  # Используем email как guest_id
                message=message_text,
                is_from_user=True,  # Сообщение от пользователя
                status=SupportStatus.OPEN
            )

            db.add(support_message)
            db.commit()
            db.refresh(support_message)

            logger.info(f"✅ Создан тикет поддержки #{support_message.id} от {sender_email}")

            # Отправляем уведомление в Telegram
            await self.notify_telegram(support_message, sender_email, subject)

        except Exception as e:
            logger.error(f"❌ Ошибка создания тикета: {e}")
            db.rollback()
        finally:
            db.close()

    async def notify_telegram(self, ticket: SupportMessage, sender_email: str, subject: str) -> None:
        """Отправляет уведомление в Telegram"""
        try:
            # Импортируем функцию уведомления
            from bot.handlers.support import notify_new_support_message

            # Формируем текст уведомления
            text = f"📧 **Новое письмо в поддержку**\n\n"
            text += f"**От:** {sender_email}\n"
            text += f"**Тема:** {subject}\n"
            text += f"**Тикет:** #{ticket.id}\n\n"
            text += f"Перейти в админку для ответа"

            await notify_new_support_message(
                user_id=ticket.user_id,
                text=text,
                guest_id=ticket.guest_id
            )

            logger.info(f"📱 Отправлено уведомление в Telegram для тикета #{ticket.id}")

        except Exception as e:
            logger.error(f"❌ Ошибка отправки в Telegram: {e}")


# Создаем экземпляр сервиса
email_receiver = EmailReceiver()