"""add_ultimate_admin_role

Revision ID: 91ad445c9532
Revises: b29bca4cf663
Create Date: 2026-05-15 11:12:57.479331

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '91ad445c9532'
down_revision: Union[str, None] = 'b29bca4cf663'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'ultimate_admin'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values without recreating the type.
    pass
