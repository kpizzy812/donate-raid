"""merge payment methods and game input fields

Revision ID: cd0d2347ec9a
Revises: f516d24f1b14, 7fd4baa92ae9
Create Date: 2025-06-29 16:11:02.999348

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cd0d2347ec9a'
down_revision: Union[str, None] = ('f516d24f1b14', '7fd4baa92ae9')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
