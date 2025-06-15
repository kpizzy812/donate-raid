"""add is_category field to article tags

Revision ID: 6eb9043955c2
Revises: f3888e5c9b55
Create Date: 2025-06-15 14:33:16.997122

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6eb9043955c2'
down_revision: Union[str, None] = 'f3888e5c9b55'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
