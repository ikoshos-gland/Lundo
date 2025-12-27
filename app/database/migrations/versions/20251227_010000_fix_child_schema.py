"""Fix child schema

Revision ID: 002
Revises: 001
Create Date: 2025-12-27 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns
    # add as nullable first
    op.add_column('children', sa.Column('date_of_birth', sa.Date(), nullable=True))
    op.add_column('children', sa.Column('notes', sa.Text(), nullable=True))
    
    # Update existing rows if any (default to today or some date to allow nullable=False)
    op.execute("UPDATE children SET date_of_birth = CURRENT_DATE WHERE date_of_birth IS NULL")
    
    # Make date_of_birth non-nullable
    op.alter_column('children', 'date_of_birth', nullable=False)

    # Drop old columns
    op.drop_column('children', 'age_years')
    op.drop_column('children', 'age_months')
    op.drop_column('children', 'preferences')
    op.drop_column('children', 'behavioral_notes')


def downgrade() -> None:
    # Re-add dropped columns
    op.add_column('children', sa.Column('behavioral_notes', sa.TEXT(), autoincrement=False, nullable=True))
    op.add_column('children', sa.Column('preferences', postgresql.JSON(astext_type=sa.Text()), autoincrement=False, nullable=True))
    op.add_column('children', sa.Column('age_months', sa.INTEGER(), server_default=sa.text('0'), autoincrement=False, nullable=True))
    op.add_column('children', sa.Column('age_years', sa.INTEGER(), autoincrement=False, nullable=True))
    
    # Update age_years for existing rows (approximate)
    op.execute("UPDATE children SET age_years = 0 WHERE age_years IS NULL")
    op.alter_column('children', 'age_years', nullable=False)

    # Drop new columns
    op.drop_column('children', 'notes')
    op.drop_column('children', 'date_of_birth')
