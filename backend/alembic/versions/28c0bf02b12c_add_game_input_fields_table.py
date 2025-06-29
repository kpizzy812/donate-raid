"""add game input fields table

Revision ID: 28c0bf02b12c
Revises: 6eb9043955c2
Create Date: 2025-06-20 11:51:51.034516

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '28c0bf02b12c'
down_revision: Union[str, None] = '6eb9043955c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('game_subcategories',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('game_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('enabled', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['game_id'], ['games.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_game_subcategories_id'), 'game_subcategories', ['id'], unique=False)
    op.add_column('products', sa.Column('subcategory_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'products', 'game_subcategories', ['subcategory_id'], ['id'], ondelete='SET NULL')
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'products', type_='foreignkey')
    op.drop_column('products', 'subcategory_id')
    op.drop_index(op.f('ix_game_subcategories_id'), table_name='game_subcategories')
    op.drop_table('game_subcategories')
    # ### end Alembic commands ###
