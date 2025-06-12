# Замените содержимое файла backend/alembic/versions/7e3fb385c3eb_add_product_enhanced_fields.py

"""add product enhanced fields

Revision ID: 7e3fb385c3eb
Revises: change_payment_and_banner
Create Date: 2025-06-12 12:52:38.541501

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7e3fb385c3eb'
down_revision: Union[str, None] = 'change_payment_and_banner'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Добавляем только новые поля в products, НЕ трогаем banner_url
    op.add_column('products', sa.Column('old_price_rub', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('products', sa.Column('special_note', sa.String(length=255), nullable=True))
    op.add_column('products', sa.Column('note_type', sa.String(length=20), nullable=True))
    op.add_column('products', sa.Column('subcategory', sa.String(length=100), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Удаляем только добавленные поля
    op.drop_column('products', 'subcategory')
    op.drop_column('products', 'note_type')
    op.drop_column('products', 'special_note')
    op.drop_column('products', 'old_price_rub')