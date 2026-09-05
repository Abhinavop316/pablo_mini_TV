"""add_username_and_is_superadmin_to_users

Revision ID: c847a19283f1
Revises: 2eb085e0963b
Create Date: 2026-09-06 01:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c847a19283f1'
down_revision: Union[str, None] = '2eb085e0963b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('username', sa.String(length=100), nullable=True))
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.add_column('users', sa.Column('is_superadmin', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    op.drop_column('users', 'is_superadmin')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_column('users', 'username')
