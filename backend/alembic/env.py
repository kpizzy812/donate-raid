import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool

from alembic import context

# чтобы alembic видел код
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings
from app.core.database import Base

# ИСПРАВЛЕНО: Явно импортируем ВСЕ модели
from app.models.user import User
from app.models.game import Game
from app.models.game_subcategory import GameSubcategory  # ДОБАВЛЕНО
from app.models.game_input_field import GameInputField   # ДОБАВЛЕНО
from app.models.game_faq import GameFAQ
from app.models.game_instruction import GameInstruction
from app.models.product import Product
from app.models.order import Order
from app.models.auth_token import AuthToken
from app.models.blog.article import Article, ArticleTag
from app.models.support import SupportMessage
from app.models.referral import ReferralEarning
from app.models.payment_terms import PaymentTerm
from app.models.review import Review  # ДОБАВЛЕНО: Импорт модели отзывов

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# 3) подставляем URL из .env
config.set_main_option('sqlalchemy.url', settings.DATABASE_URL)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 4) указываем Alembic, какие метаданные нужно мигрировать
target_metadata = Base.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()