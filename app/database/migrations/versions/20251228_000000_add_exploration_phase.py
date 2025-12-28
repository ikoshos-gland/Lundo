"""Add exploration phase tracking

Revision ID: 003
Revises: 002
Create Date: 2025-12-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add exploration columns to conversations table
    op.add_column(
        'conversations',
        sa.Column('exploration_phase', sa.String(50), nullable=False, server_default='not_started')
    )
    op.add_column(
        'conversations',
        sa.Column('current_exploration_topic_id', sa.String(50), nullable=True)
    )

    # Create exploration_qa table
    op.create_table(
        'exploration_qa',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('topic_id', sa.String(length=50), nullable=False),
        sa.Column('question_type', sa.String(length=20), nullable=False),
        sa.Column('question_number', sa.Integer(), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('answer', sa.Text(), nullable=True),
        sa.Column('asked_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('answered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_exploration_qa_conversation_id', 'exploration_qa', ['conversation_id'])
    op.create_index('ix_exploration_qa_topic_id', 'exploration_qa', ['topic_id'])


def downgrade() -> None:
    # Drop exploration_qa table
    op.drop_index('ix_exploration_qa_topic_id', table_name='exploration_qa')
    op.drop_index('ix_exploration_qa_conversation_id', table_name='exploration_qa')
    op.drop_table('exploration_qa')

    # Remove columns from conversations
    op.drop_column('conversations', 'current_exploration_topic_id')
    op.drop_column('conversations', 'exploration_phase')
