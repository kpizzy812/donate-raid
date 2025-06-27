# В новый файл backend/alembic/versions/XXXXXX_add_robokassa_payment_methods.py
# (номер будет сгенерирован автоматически)

"""add robokassa payment methods

Revision ID: [будет сгенерирован]
Revises: 347db8c9214b
Create Date: [будет сгенерирована]

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '7fd4baa92ae9'
down_revision: Union[str, None] = '347db8c9214b'  # последняя миграция
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Добавляем новые значения в enum paymentmethod
    op.execute("ALTER TYPE paymentmethod ADD VALUE 'sberbank'")
    op.execute("ALTER TYPE paymentmethod ADD VALUE 'sbp'")
    op.execute("ALTER TYPE paymentmethod ADD VALUE 'ton'")
    op.execute("ALTER TYPE paymentmethod ADD VALUE 'usdt'")
    op.execute("ALTER TYPE paymentmethod ADD VALUE 'unitpay'")


def downgrade() -> None:
    """Downgrade schema."""
    # В PostgreSQL нельзя удалять значения из enum простым способом
    # Поэтому просто оставляем комментарий
    pass  # Cannot remove enum values in PostgreSQL easily