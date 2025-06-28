"""add new payment methods to enum

Revision ID: add_payment_methods
Revises: 2ccbe705fab7
Create Date: 2025-06-28 15:30:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_payment_methods'
down_revision: Union[str, None] = '2ccbe705fab7'  # последняя существующая миграция
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Добавляем новые значения в enum paymentmethod по одному
    # Игнорируем ошибки если значение уже есть
    try:
        op.execute("ALTER TYPE paymentmethod ADD VALUE 'sberbank'")
    except Exception:
        pass

    try:
        op.execute("ALTER TYPE paymentmethod ADD VALUE 'sbp'")
    except Exception:
        pass

    try:
        op.execute("ALTER TYPE paymentmethod ADD VALUE 'ton'")
    except Exception:
        pass

    try:
        op.execute("ALTER TYPE paymentmethod ADD VALUE 'usdt'")
    except Exception:
        pass

    try:
        op.execute("ALTER TYPE paymentmethod ADD VALUE 'unitpay'")
    except Exception:
        pass

    # Добавляем столбец payment_url если его нет
    try:
        op.add_column('orders', sa.Column('payment_url', sa.String(500), nullable=True))
    except Exception:
        pass


def downgrade() -> None:
    """Downgrade schema."""
    # В PostgreSQL нельзя легко удалить значения из enum
    # Удаляем добавленный столбец
    try:
        op.drop_column('orders', 'payment_url')
    except Exception:
        pass