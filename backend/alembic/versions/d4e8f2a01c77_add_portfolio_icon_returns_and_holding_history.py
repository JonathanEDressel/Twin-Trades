"""add_portfolio_icon_returns_and_holding_history

Revision ID: d4e8f2a01c77
Revises: c3a7f912d845
Create Date: 2026-05-15 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e8f2a01c77'
down_revision: Union[str, None] = 'c3a7f912d845'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to portfolios
    op.add_column('portfolios', sa.Column('icon_url', sa.String(length=500), nullable=True))
    op.add_column('portfolios', sa.Column('return_1w', sa.Numeric(18, 2), nullable=True))
    op.add_column('portfolios', sa.Column('return_1m', sa.Numeric(18, 2), nullable=True))
    op.add_column('portfolios', sa.Column('return_3m', sa.Numeric(18, 2), nullable=True))
    op.add_column('portfolios', sa.Column('return_6m', sa.Numeric(18, 2), nullable=True))
    op.add_column('portfolios', sa.Column('return_1y', sa.Numeric(18, 2), nullable=True))
    op.add_column('portfolios', sa.Column('return_3y', sa.Numeric(18, 2), nullable=True))

    # Create portfolio_holding_history table
    op.create_table(
        'portfolio_holding_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('portfolio_id', sa.Integer(), nullable=False),
        sa.Column('ticker', sa.String(length=10), nullable=False),
        sa.Column('change_type', sa.String(length=20), nullable=False),
        sa.Column('target_pct', sa.Numeric(18, 2), nullable=False),
        sa.Column('old_target_pct', sa.Numeric(18, 2), nullable=True),
        sa.Column('changed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('changed_by_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['portfolio_id'], ['portfolios.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['changed_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_portfolio_holding_history_portfolio_id', 'portfolio_holding_history', ['portfolio_id'])


def downgrade() -> None:
    op.drop_index('ix_portfolio_holding_history_portfolio_id', table_name='portfolio_holding_history')
    op.drop_table('portfolio_holding_history')
    op.drop_column('portfolios', 'return_3y')
    op.drop_column('portfolios', 'return_1y')
    op.drop_column('portfolios', 'return_6m')
    op.drop_column('portfolios', 'return_3m')
    op.drop_column('portfolios', 'return_1m')
    op.drop_column('portfolios', 'return_1w')
    op.drop_column('portfolios', 'icon_url')
