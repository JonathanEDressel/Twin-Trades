"""add_subscription_billing_events

Revision ID: e5f3a1b02d88
Revises: d4e8f2a01c77
Create Date: 2026-05-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f3a1b02d88'
down_revision: Union[str, None] = 'd4e8f2a01c77'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'subscription_billing_events',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('subscription_id', sa.Integer(), nullable=True),
        sa.Column(
            'event_type',
            sa.Enum(
                'payment_success', 'payment_failed', 'renewal', 'refund', 'cancellation',
                name='billingeventtype',
            ),
            nullable=False,
        ),
        sa.Column('amount', sa.Numeric(18, 2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='USD'),
        sa.Column('apple_transaction_id', sa.String(length=255), nullable=True),
        sa.Column('occurred_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_subscription_billing_events_user_id',
        'subscription_billing_events',
        ['user_id'],
    )


def downgrade() -> None:
    op.drop_index('ix_subscription_billing_events_user_id', table_name='subscription_billing_events')
    op.drop_table('subscription_billing_events')
    op.execute("DROP TYPE IF EXISTS billingeventtype")
