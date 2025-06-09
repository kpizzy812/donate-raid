from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Extra

class Settings(BaseSettings):
    # База данных
    DATABASE_URL: str

    # JWT
    JWT_SECRET: str

    # Email отправка (делаем optional, чтобы alembic не падал)
    MAIL_FROM: Optional[str] = None
    MAIL_SERVER: Optional[str] = None
    MAIL_PORT: Optional[int] = None
    MAIL_USERNAME: Optional[str] = None
    MAIL_PASSWORD: Optional[str] = None

    # Telegram-бот
    TG_BOT_TOKEN: Optional[str] = None
    TG_ADMIN_CHAT_IDS: Optional[str] = None

    # Фронт (для ссылок в письмах)
    FRONTEND_URL: str = "http://localhost:8000"  # fallback

    class Config:
        env_file = ".env"  # или ".env.dev" — в зависимости от окружения
        extra = 'allow'


settings = Settings()
