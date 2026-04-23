"""Alembic migration script template."""
# revision identifiers, used by Alembic.
revision = "${revision}"
down_revision = ${down_revision}
branch_labels = ${branch_labels}
depends_on = ${depends_on}

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
