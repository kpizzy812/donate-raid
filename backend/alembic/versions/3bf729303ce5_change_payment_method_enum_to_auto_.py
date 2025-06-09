"""change payment_method enum and banner_url field

Revision ID: change_payment_and_banner
Revises: 602a81688e37
Create Date: 2025-06-06

"""
from alembic import op
import sqlalchemy as sa

revision = 'change_payment_and_banner'
down_revision = '602a81688e37'
branch_labels = None
depends_on = None


def upgrade():
    # Обновляем ENUM paymentmethod
    op.execute("ALTER TYPE paymentmethod RENAME TO paymentmethod_old")
    op.execute("CREATE TYPE paymentmethod AS ENUM ('auto', 'manual')")
    op.execute("""
        ALTER TABLE orders
        ALTER COLUMN payment_method TYPE paymentmethod
        USING payment_method::text::paymentmethod
    """)
    op.execute("DROP TYPE paymentmethod_old")

    # Обновляем banner_url → TEXT
    op.alter_column(
        'games', 'banner_url',
        existing_type=sa.String(length=255),
        type_=sa.Text(),
        existing_nullable=True
    )


def downgrade():
    # Откат ENUM
    op.execute("CREATE TYPE paymentmethod_old AS ENUM ('ton', 'xgen', 'usdt', 'manual')")
    op.execute("""
        ALTER TABLE orders
        ALTER COLUMN payment_method TYPE paymentmethod_old
        USING payment_method::text::paymentmethod_old
    """)
    op.execute("DROP TYPE paymentmethod")
    op.execute("ALTER TYPE paymentmethod_old RENAME TO paymentmethod")

    # Откат banner_url → VARCHAR(255)
    op.alter_column(
        'games', 'banner_url',
        existing_type=sa.Text(),
        type_=sa.String(length=255),
        existing_nullable=True
    )
