# backend/alembic/versions/add_product_custom_fields.py
"""add product custom fields

Revision ID: add_product_custom_fields
Revises: 3bf729303ce5
Create Date: 2025-06-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_product_custom_fields'
down_revision: Union[str, None] = '3bf729303ce5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Добавляем новые поля к таблице products
    op.add_column('products', sa.Column('old_price_rub', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('products', sa.Column('special_note', sa.String(length=255), nullable=True))
    op.add_column('products', sa.Column('note_type', sa.String(length=20), nullable=True, server_default='warning'))
    op.add_column('products', sa.Column('subcategory', sa.String(length=100), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('products', 'subcategory')
    op.drop_column('products', 'note_type')
    op.drop_column('products', 'special_note')
    op.drop_column('products', 'old_price_rub')