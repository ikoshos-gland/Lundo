# PostgreSQL Learning Guide - Lundo Project

This guide teaches you PostgreSQL through the Lundo project. Learn databases from scratch by understanding how this real application stores and retrieves data.

---

## Table of Contents

1. [What is PostgreSQL?](#1-what-is-postgresql)
2. [Core Concepts](#2-core-concepts)
3. [Setting Up PostgreSQL](#3-setting-up-postgresql)
4. [Database Schema Design](#4-database-schema-design)
5. [SQLAlchemy ORM](#5-sqlalchemy-orm)
6. [CRUD Operations](#6-crud-operations)
7. [Relationships](#7-relationships)
8. [Querying Data](#8-querying-data)
9. [Indexes and Performance](#9-indexes-and-performance)
10. [Migrations with Alembic](#10-migrations-with-alembic)
11. [Transactions](#11-transactions)
12. [Connection Pooling](#12-connection-pooling)
13. [PostgreSQL-Specific Features](#13-postgresql-specific-features)
14. [Common Patterns](#14-common-patterns)
15. [YouTube Learning Resources](#15-youtube-learning-resources)
16. [Hands-On Exercises](#16-hands-on-exercises)

---

## 1. What is PostgreSQL?

PostgreSQL (often called "Postgres") is a **relational database** - it stores data in tables with rows and columns, like a spreadsheet but much more powerful.

### Why Use a Database?

| Without Database | With Database |
|------------------|---------------|
| Data in files | Data in tables |
| No relationships | Tables can link together |
| No validation | Enforces data rules |
| Slow searches | Fast indexed searches |
| Lost on crash | Survives crashes |
| One user at a time | Many users simultaneously |

### PostgreSQL vs Others

| Database | Best For |
|----------|----------|
| **PostgreSQL** | Complex apps, reliability, advanced features |
| MySQL | Simple web apps, read-heavy workloads |
| SQLite | Small apps, mobile, embedded |
| MongoDB | Unstructured data, rapid prototyping |

### Real Example from Lundo

```
Parent registers → User saved in PostgreSQL
Parent adds child → Child linked to User
Parent chats → Messages saved to Conversation
```

All this data persists even if the server restarts.

---

## 2. Core Concepts

### 2.1 Tables

A table is like a spreadsheet. Each **row** is a record, each **column** is a field.

```
┌──────────────────────────────────────────────────────┐
│                    users table                        │
├────┬─────────────────────┬───────────┬───────────────┤
│ id │ email               │ full_name │ is_active     │
├────┼─────────────────────┼───────────┼───────────────┤
│ 1  │ john@example.com    │ John Doe  │ true          │
│ 2  │ jane@example.com    │ Jane Smith│ true          │
│ 3  │ bob@example.com     │ Bob Wilson│ false         │
└────┴─────────────────────┴───────────┴───────────────┘
```

### 2.2 Primary Keys

A **primary key** uniquely identifies each row. Usually an auto-incrementing `id`.

```sql
id SERIAL PRIMARY KEY  -- Auto-increments: 1, 2, 3, ...
```

### 2.3 Foreign Keys

A **foreign key** links one table to another.

```
users (id=1, name="John")
    ↓
children (id=1, parent_id=1, name="Tommy")  -- parent_id links to users.id
```

### 2.4 Data Types

| PostgreSQL Type | Python Type | Example |
|-----------------|-------------|---------|
| `INTEGER` | `int` | `42` |
| `VARCHAR(255)` | `str` | `"hello"` |
| `TEXT` | `str` | Long text |
| `BOOLEAN` | `bool` | `True/False` |
| `DATE` | `date` | `2024-01-15` |
| `TIMESTAMP` | `datetime` | `2024-01-15 10:30:00` |
| `JSON` | `dict` | `{"key": "value"}` |

### 2.5 SQL Basics

SQL (Structured Query Language) talks to databases:

```sql
-- Create
INSERT INTO users (email, full_name) VALUES ('john@example.com', 'John');

-- Read
SELECT * FROM users WHERE email = 'john@example.com';

-- Update
UPDATE users SET full_name = 'John Doe' WHERE id = 1;

-- Delete
DELETE FROM users WHERE id = 1;
```

---

## 3. Setting Up PostgreSQL

### 3.1 Using Docker (Recommended)

**File:** `docker-compose.yml`

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg15    # PostgreSQL 15 with vector extension
    container_name: lundo-postgres
    environment:
      POSTGRES_USER: postgres         # Database username
      POSTGRES_PASSWORD: postgres     # Database password
      POSTGRES_DB: child_therapist    # Database name
    ports:
      - "5433:5432"                   # Host:Container port
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Persist data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:  # Named volume for persistence
```

### 3.2 Starting PostgreSQL

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Check if running
docker-compose ps

# View logs
docker-compose logs postgres

# Stop
docker-compose down
```

### 3.3 Connecting to PostgreSQL

```bash
# Using psql (PostgreSQL CLI)
docker exec -it lundo-postgres psql -U postgres -d child_therapist

# Or install psql locally and connect
psql -h localhost -p 5433 -U postgres -d child_therapist
```

### 3.4 Connection String

The connection string tells your app how to connect:

```
postgresql://username:password@host:port/database
```

**Examples:**
```
# Local Docker
postgresql://postgres:postgres@localhost:5433/child_therapist

# With async driver (for Python async)
postgresql+asyncpg://postgres:postgres@localhost:5433/child_therapist
```

### 3.5 Environment Variables

**File:** `.env`

```env
# Database connection
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/child_therapist

# Individual components (for Docker)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=child_therapist
```

---

## 4. Database Schema Design

### 4.1 Lundo's Schema

```
┌─────────────┐       ┌─────────────┐       ┌────────────────┐       ┌──────────────┐
│   users     │       │  children   │       │ conversations  │       │   messages   │
├─────────────┤       ├─────────────┤       ├────────────────┤       ├──────────────┤
│ id (PK)     │←──┐   │ id (PK)     │←──┐   │ id (PK)        │←──┐   │ id (PK)      │
│ email       │   │   │ parent_id(FK)────┘   │ child_id (FK)──────┘   │ conv_id (FK)─────┘
│ full_name   │   │   │ name        │       │ user_id (FK)───────┘   │ role         │
│ password    │   │   │ date_of_birth│      │ thread_id      │       │ content      │
│ is_active   │   └───│ gender      │       │ title          │       │ extra_data   │
│ firebase_uid│       │ notes       │       │ is_active      │       │ created_at   │
│ created_at  │       │ created_at  │       │ created_at     │       └──────────────┘
│ updated_at  │       │ updated_at  │       │ updated_at     │
└─────────────┘       └─────────────┘       └────────────────┘

PK = Primary Key
FK = Foreign Key
← = Relationship direction
```

### 4.2 Design Principles Used

**1. One Parent, Many Children (1:N)**
```
User 1 ──┬── Child 1 (Tommy)
         ├── Child 2 (Sarah)
         └── Child 3 (Mike)
```

**2. Cascade Delete**
- Delete User → Deletes all Children → Deletes all Conversations → Deletes all Messages
- Important for GDPR compliance (right to be forgotten)

**3. Calculated vs Stored**
- `date_of_birth` is stored
- `age_years` is calculated from it (not stored)
- Why? Stored age becomes wrong over time

**4. Nullable vs Required**
```python
# Required (NOT NULL)
email: str           # Must have email
name: str            # Must have name

# Optional (NULLABLE)
gender: str | None   # Can be empty
notes: str | None    # Can be empty
firebase_uid: str | None  # Only for Firebase users
```

### 4.3 Naming Conventions

| Convention | Example | Rule |
|------------|---------|------|
| Table names | `users`, `children` | Plural, lowercase |
| Column names | `parent_id`, `created_at` | snake_case |
| Primary key | `id` | Always `id` |
| Foreign key | `parent_id`, `child_id` | `{table}_id` |
| Booleans | `is_active`, `is_verified` | `is_` prefix |
| Timestamps | `created_at`, `updated_at` | `_at` suffix |

---

## 5. SQLAlchemy ORM

### 5.1 What is an ORM?

ORM (Object-Relational Mapping) lets you use Python instead of SQL:

```python
# Without ORM (raw SQL)
cursor.execute("INSERT INTO users (email) VALUES ('john@example.com')")

# With ORM (Python objects)
user = User(email="john@example.com")
db.add(user)
```

### 5.2 Base Model

**File:** `app/database/base.py`

```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func
from datetime import datetime

class Base(DeclarativeBase):
    """Base class for all models - provides common columns"""

    # Every table gets an auto-incrementing ID
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Every table tracks when rows were created
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),  # PostgreSQL sets this
        nullable=False
    )

    # Every table tracks when rows were updated
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),  # Auto-updates on change
        nullable=False
    )

    def to_dict(self) -> dict:
        """Convert model to dictionary"""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }
```

### 5.3 Defining Models

**File:** `app/models/user.py`

```python
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
from typing import TYPE_CHECKING

# Avoid circular imports
if TYPE_CHECKING:
    from app.models.child import Child

class User(Base):
    __tablename__ = "users"  # Table name in PostgreSQL

    # Columns
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,      # No duplicate emails
        index=True,       # Fast lookups
        nullable=False
    )

    hashed_password: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True     # Firebase users don't have passwords
    )

    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    firebase_uid: Mapped[str | None] = mapped_column(
        String(128),
        unique=True,
        index=True,
        nullable=True
    )

    # Relationship: User has many Children
    children: Mapped[list["Child"]] = relationship(
        "Child",
        back_populates="parent",
        cascade="all, delete-orphan"  # Delete children when user deleted
    )
```

**File:** `app/models/child.py`

```python
from sqlalchemy import String, Date, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
from app.database.base import Base

class Child(Base):
    __tablename__ = "children"

    # Foreign key to users table
    parent_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)

    gender: Mapped[str | None] = mapped_column(String(50), nullable=True)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationship back to User
    parent: Mapped["User"] = relationship("User", back_populates="children")

    # Relationship to Conversations
    conversations: Mapped[list["Conversation"]] = relationship(
        "Conversation",
        back_populates="child",
        cascade="all, delete-orphan"
    )

    # Calculated property (not stored in database)
    @property
    def age_years(self) -> int:
        today = date.today()
        born = self.date_of_birth
        return today.year - born.year - (
            (today.month, today.day) < (born.month, born.day)
        )
```

### 5.4 Column Types Reference

```python
from sqlalchemy import (
    String,      # VARCHAR - variable length text
    Text,        # TEXT - unlimited text
    Integer,     # INTEGER - whole numbers
    Boolean,     # BOOLEAN - true/false
    Date,        # DATE - date only
    DateTime,    # TIMESTAMP - date and time
    Float,       # REAL - decimal numbers
    JSON,        # JSON - structured data
    ForeignKey   # Link to another table
)

# Usage examples
name: Mapped[str] = mapped_column(String(255))
bio: Mapped[str] = mapped_column(Text)
age: Mapped[int] = mapped_column(Integer)
is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
birthday: Mapped[date] = mapped_column(Date)
created: Mapped[datetime] = mapped_column(DateTime(timezone=True))
settings: Mapped[dict] = mapped_column(JSON)
user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
```

---

## 6. CRUD Operations

CRUD = **C**reate, **R**ead, **U**pdate, **D**elete

### 6.1 Create (INSERT)

```python
from app.models.user import User

# Create a new user
new_user = User(
    email="john@example.com",
    full_name="John Doe",
    hashed_password="hashed_value_here"
)

# Add to session (staging)
db.add(new_user)

# Commit to database (saves permanently)
await db.commit()

# Refresh to get auto-generated values (id, timestamps)
await db.refresh(new_user)

print(new_user.id)  # Now has an ID!
print(new_user.created_at)  # Now has timestamp!
```

**What Happens:**
```sql
INSERT INTO users (email, full_name, hashed_password, is_active, is_verified)
VALUES ('john@example.com', 'John Doe', 'hashed_value_here', true, false)
RETURNING id, created_at, updated_at;
```

### 6.2 Read (SELECT)

**Single record by ID:**
```python
from sqlalchemy import select

# Method 1: Using select
result = await db.execute(
    select(User).where(User.id == 1)
)
user = result.scalar_one_or_none()  # Returns User or None

# Method 2: Using get (primary key only)
user = await db.get(User, 1)
```

**Multiple records:**
```python
# Get all active users
result = await db.execute(
    select(User).where(User.is_active == True)
)
users = result.scalars().all()  # Returns list of Users
```

**With filtering:**
```python
# Get user by email
result = await db.execute(
    select(User).where(User.email == "john@example.com")
)
user = result.scalar_one_or_none()
```

### 6.3 Update

```python
# Step 1: Fetch the record
result = await db.execute(
    select(User).where(User.id == 1)
)
user = result.scalar_one_or_none()

if user:
    # Step 2: Modify attributes
    user.full_name = "John Smith"
    user.is_verified = True

    # Step 3: Commit changes
    await db.commit()

    # Step 4: Refresh to get updated_at
    await db.refresh(user)
```

**What Happens:**
```sql
UPDATE users
SET full_name = 'John Smith', is_verified = true, updated_at = NOW()
WHERE id = 1;
```

### 6.4 Delete

```python
# Step 1: Fetch the record
result = await db.execute(
    select(User).where(User.id == 1)
)
user = result.scalar_one_or_none()

if user:
    # Step 2: Delete
    await db.delete(user)

    # Step 3: Commit
    await db.commit()
```

**What Happens (with cascade):**
```sql
-- First, cascaded deletes happen automatically:
DELETE FROM messages WHERE conversation_id IN (
    SELECT id FROM conversations WHERE child_id IN (
        SELECT id FROM children WHERE parent_id = 1
    )
);
DELETE FROM conversations WHERE child_id IN (
    SELECT id FROM children WHERE parent_id = 1
);
DELETE FROM children WHERE parent_id = 1;

-- Then the user:
DELETE FROM users WHERE id = 1;
```

---

## 7. Relationships

### 7.1 One-to-Many (1:N)

One User has Many Children:

```python
# In User model
children: Mapped[list["Child"]] = relationship(
    "Child",
    back_populates="parent",
    cascade="all, delete-orphan"
)

# In Child model
parent_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
parent: Mapped["User"] = relationship("User", back_populates="children")
```

**Usage:**
```python
# Get user's children
user = await db.get(User, 1)
for child in user.children:
    print(child.name)

# Get child's parent
child = await db.get(Child, 1)
print(child.parent.email)
```

### 7.2 Relationship Loading

By default, relationships are **lazy loaded** (queried when accessed). For better performance, use **eager loading**:

```python
from sqlalchemy.orm import selectinload

# Load user with all children in ONE query
result = await db.execute(
    select(User)
    .where(User.id == 1)
    .options(selectinload(User.children))  # Eager load
)
user = result.scalar_one_or_none()

# Now user.children is already loaded, no additional query
for child in user.children:
    print(child.name)
```

### 7.3 Cascade Options

```python
cascade="all, delete-orphan"
```

| Option | Meaning |
|--------|---------|
| `save-update` | Saving parent saves children |
| `delete` | Deleting parent deletes children |
| `delete-orphan` | Removing child from list deletes it |
| `all` | Includes save-update, merge, delete, etc. |

### 7.4 Database-Level Cascade

```python
parent_id: Mapped[int] = mapped_column(
    ForeignKey("users.id", ondelete="CASCADE")
)
```

| Option | Effect |
|--------|--------|
| `CASCADE` | Delete children when parent deleted |
| `SET NULL` | Set foreign key to NULL |
| `RESTRICT` | Prevent deletion if children exist |
| `NO ACTION` | Similar to RESTRICT |

---

## 8. Querying Data

### 8.1 Basic Queries

```python
from sqlalchemy import select, desc, asc

# Select all
result = await db.execute(select(User))
users = result.scalars().all()

# Select with condition
result = await db.execute(
    select(User).where(User.is_active == True)
)

# Select specific columns
result = await db.execute(
    select(User.id, User.email)
)
rows = result.all()  # Returns tuples: [(1, 'a@b.com'), ...]

# Order by
result = await db.execute(
    select(User).order_by(desc(User.created_at))
)

# Limit
result = await db.execute(
    select(User).limit(10)
)

# Offset (pagination)
result = await db.execute(
    select(User).offset(20).limit(10)  # Skip 20, take 10
)
```

### 8.2 Filtering (WHERE)

```python
from sqlalchemy import and_, or_, not_

# Simple equality
select(User).where(User.email == "john@example.com")

# Multiple conditions (AND)
select(User).where(
    User.is_active == True,
    User.is_verified == True
)

# OR conditions
select(User).where(
    or_(
        User.email == "john@example.com",
        User.email == "jane@example.com"
    )
)

# NOT
select(User).where(not_(User.is_active))

# LIKE (pattern matching)
select(User).where(User.email.like("%@gmail.com"))

# IN list
select(User).where(User.id.in_([1, 2, 3]))

# NULL check
select(User).where(User.firebase_uid.is_(None))
select(User).where(User.firebase_uid.is_not(None))

# Comparison
select(Child).where(Child.date_of_birth >= date(2020, 1, 1))
```

### 8.3 Joins

```python
# Implicit join (through relationship)
result = await db.execute(
    select(Conversation)
    .join(Child)
    .where(Child.parent_id == user_id)
)

# Explicit join
result = await db.execute(
    select(Message, Conversation)
    .join(Conversation, Message.conversation_id == Conversation.id)
    .where(Conversation.child_id == child_id)
)
```

### 8.4 Aggregations

```python
from sqlalchemy import func

# Count
result = await db.execute(
    select(func.count(User.id))
)
count = result.scalar()

# Count with condition
result = await db.execute(
    select(func.count(User.id)).where(User.is_active == True)
)

# Group by
result = await db.execute(
    select(
        Child.parent_id,
        func.count(Child.id).label("child_count")
    )
    .group_by(Child.parent_id)
)
```

### 8.5 Real Examples from Lundo

**Get user's children:**
```python
result = await db.execute(
    select(Child)
    .where(Child.parent_id == current_user.id)
    .order_by(Child.name)
)
children = result.scalars().all()
```

**Get conversation with messages:**
```python
# Get conversation
conv_result = await db.execute(
    select(Conversation).where(Conversation.id == conversation_id)
)
conversation = conv_result.scalar_one_or_none()

# Get messages
msg_result = await db.execute(
    select(Message)
    .where(Message.conversation_id == conversation_id)
    .order_by(Message.id.asc())
    .limit(50)
)
messages = msg_result.scalars().all()
```

**List conversations for user:**
```python
result = await db.execute(
    select(Conversation)
    .join(Child)
    .where(Child.parent_id == current_user.id)
    .order_by(desc(Conversation.updated_at))
)
conversations = result.scalars().all()
```

---

## 9. Indexes and Performance

### 9.1 What is an Index?

An index is like a book's table of contents - it speeds up finding data.

```
Without index: Scan ALL rows to find email
With index:    Jump directly to the right row
```

### 9.2 Creating Indexes

```python
# In SQLAlchemy model
email: Mapped[str] = mapped_column(
    String(255),
    index=True  # Creates index on this column
)

# Unique index (no duplicates allowed)
email: Mapped[str] = mapped_column(
    String(255),
    unique=True,  # Automatically creates unique index
    index=True
)
```

### 9.3 When to Add Indexes

**Add index when:**
- Column is used in WHERE clauses frequently
- Column is used in JOIN conditions
- Column is used in ORDER BY
- Column needs uniqueness

**Don't add index when:**
- Table is small (< 1000 rows)
- Column has few unique values (like boolean)
- Column is rarely queried

### 9.4 Indexes in Lundo

```python
# users table
email          - UNIQUE INDEX (login lookups)
firebase_uid   - UNIQUE INDEX (Firebase auth)

# children table
parent_id      - INDEX (get children for user)

# conversations table
thread_id      - UNIQUE INDEX (LangGraph lookups)
child_id       - INDEX (get conversations for child)
user_id        - INDEX (get conversations for user)

# messages table
conversation_id - INDEX (get messages for conversation)
```

### 9.5 Viewing Query Performance

In PostgreSQL, use `EXPLAIN ANALYZE`:

```sql
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'john@example.com';

-- Output shows:
-- Index Scan using ix_users_email on users  (actual time=0.015..0.016 rows=1)
```

---

## 10. Migrations with Alembic

### 10.1 What are Migrations?

Migrations track database schema changes over time. Instead of manually running SQL, you version control your schema.

```
Version 1: Create users table
Version 2: Add is_verified column
Version 3: Create children table
```

### 10.2 Alembic Setup

**File:** `alembic.ini`
```ini
[alembic]
script_location = app/database/migrations
sqlalchemy.url = postgresql+asyncpg://postgres:postgres@localhost:5433/child_therapist
```

**File:** `app/database/migrations/env.py`
```python
from app.database.base import Base
from app.models import user, child, conversation, message  # Import all models

target_metadata = Base.metadata  # Alembic uses this to detect changes
```

### 10.3 Creating Migrations

```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "add is_verified to users"

# This creates a new file in app/database/migrations/versions/
```

**Generated migration file:**
```python
def upgrade():
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), default=False))

def downgrade():
    op.drop_column('users', 'is_verified')
```

### 10.4 Running Migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade abc123

# View current version
alembic current

# View migration history
alembic history
```

### 10.5 Common Migration Operations

```python
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Create table
    op.create_table(
        'children',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('parent_id', sa.Integer(), sa.ForeignKey('users.id'))
    )

    # Add column
    op.add_column('users', sa.Column('phone', sa.String(20)))

    # Drop column
    op.drop_column('users', 'old_field')

    # Create index
    op.create_index('ix_users_phone', 'users', ['phone'])

    # Add foreign key
    op.create_foreign_key(
        'fk_children_parent',
        'children', 'users',
        ['parent_id'], ['id'],
        ondelete='CASCADE'
    )

def downgrade():
    # Reverse all operations
    op.drop_table('children')
```

### 10.6 Lundo's Migrations

**Migration 1:** Initial schema
- Created: users, children, conversations, messages tables
- Set up foreign keys and indexes

**Migration 2:** Fix child schema
- Removed: `age_years`, `age_months` columns
- Added: `date_of_birth` column
- Reason: Age should be calculated, not stored

---

## 11. Transactions

### 11.1 What is a Transaction?

A transaction is a group of operations that either ALL succeed or ALL fail.

```python
# Without transaction - data can be inconsistent
db.add(user)      # This succeeds
db.add(child)     # This fails - but user is already saved!

# With transaction - all or nothing
async with db.begin():
    db.add(user)
    db.add(child)  # If this fails, user is NOT saved
```

### 11.2 Automatic Transaction Management

**File:** `app/database/session.py`

```python
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()    # Commit if successful
        except Exception:
            await session.rollback()  # Rollback on any error
            raise
        finally:
            await session.close()
```

Every FastAPI endpoint automatically gets a transaction:
- Success → changes committed
- Error → changes rolled back

### 11.3 Manual Transaction Control

```python
# Explicit transaction
async with db.begin():
    db.add(user)
    db.add(child)
    # Commits automatically at end of block
    # Rolls back automatically if exception

# Or manually
try:
    db.add(user)
    db.add(child)
    await db.commit()
except Exception:
    await db.rollback()
    raise
```

### 11.4 Savepoints (Nested Transactions)

```python
async with db.begin():
    db.add(user)

    # Create savepoint
    async with db.begin_nested():
        try:
            db.add(risky_operation)
        except Exception:
            # Only this part rolls back
            pass

    # user is still saved!
    await db.commit()
```

---

## 12. Connection Pooling

### 12.1 What is Connection Pooling?

Opening database connections is slow. Connection pooling keeps connections open and reuses them.

```
Without pooling:
Request 1 → Open connection → Query → Close connection
Request 2 → Open connection → Query → Close connection  (slow!)

With pooling:
Request 1 → Get from pool → Query → Return to pool
Request 2 → Get from pool → Query → Return to pool      (fast!)
```

### 12.2 Pool Configuration

**File:** `app/database/session.py`

```python
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,     # Print SQL queries in debug mode
    pool_pre_ping=True,      # Test connection before use
    pool_size=10,            # Keep 10 connections ready
    max_overflow=20          # Allow 20 more under load
)
```

| Setting | Value | Meaning |
|---------|-------|---------|
| `pool_size` | 10 | Base number of connections |
| `max_overflow` | 20 | Extra connections allowed |
| `pool_pre_ping` | True | Verify connection before use |
| `pool_recycle` | 3600 | Reconnect after 1 hour |

### 12.3 Connection Limits

```
pool_size (10) + max_overflow (20) = 30 max connections

If you have:
- 50 concurrent requests
- Each needs a connection
- Only 30 available
- 20 requests wait in queue
```

### 12.4 Monitoring Connections

```sql
-- View active connections in PostgreSQL
SELECT * FROM pg_stat_activity WHERE datname = 'child_therapist';

-- Count connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'child_therapist';
```

---

## 13. PostgreSQL-Specific Features

### 13.1 pgvector Extension

Lundo uses pgvector for AI embeddings (semantic search):

```python
# In docker-compose.yml
image: pgvector/pgvector:pg15  # PostgreSQL with vector support

# Usage for AI memory search
store = AsyncPostgresStore.from_conn_string(
    conn_string,
    index={
        "embed": embeddings,
        "dims": 1536,  # Vector dimensions
    }
)
```

### 13.2 TIMESTAMP WITH TIME ZONE

```python
created_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True),  # Stores timezone info
    server_default=func.now()
)
```

PostgreSQL stores the UTC time and converts to your timezone when querying.

### 13.3 Server-Side Defaults

```python
# Python default (set by Python)
is_active: Mapped[bool] = mapped_column(default=True)

# Server default (set by PostgreSQL)
created_at: Mapped[datetime] = mapped_column(
    server_default=func.now()  # PostgreSQL's NOW() function
)
```

**Why server defaults?**
- Consistent across all clients
- Works even with raw SQL inserts
- Database handles timing, not application

### 13.4 Text Search

```sql
-- PostgreSQL full-text search
SELECT * FROM messages
WHERE to_tsvector('english', content) @@ to_tsquery('behavior & problem');
```

### 13.5 JSON Operations

```sql
-- Store JSON
INSERT INTO users (settings) VALUES ('{"theme": "dark"}');

-- Query JSON
SELECT * FROM users WHERE settings->>'theme' = 'dark';

-- Update JSON
UPDATE users SET settings = settings || '{"language": "en"}';
```

---

## 14. Common Patterns

### 14.1 Pagination Pattern

```python
async def get_items(
    db: AsyncSession,
    page: int = 1,
    per_page: int = 10
):
    offset = (page - 1) * per_page

    result = await db.execute(
        select(Item)
        .order_by(Item.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    return result.scalars().all()
```

### 14.2 Soft Delete Pattern

Instead of deleting, mark as inactive:

```python
class User(Base):
    is_deleted: Mapped[bool] = mapped_column(default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)

# "Delete"
user.is_deleted = True
user.deleted_at = datetime.utcnow()

# Query only active
select(User).where(User.is_deleted == False)
```

### 14.3 Ownership Check Pattern

```python
async def get_child(child_id: int, user: User, db: AsyncSession):
    result = await db.execute(
        select(Child).where(
            Child.id == child_id,
            Child.parent_id == user.id  # Ownership check
        )
    )
    child = result.scalar_one_or_none()

    if not child:
        raise HTTPException(404, "Child not found")

    return child
```

### 14.4 Upsert Pattern (Insert or Update)

```python
from sqlalchemy.dialects.postgresql import insert

stmt = insert(User).values(
    email="john@example.com",
    full_name="John Doe"
)

stmt = stmt.on_conflict_do_update(
    index_elements=['email'],  # Conflict on email
    set_={
        'full_name': stmt.excluded.full_name,
        'updated_at': func.now()
    }
)

await db.execute(stmt)
await db.commit()
```

### 14.5 Bulk Insert Pattern

```python
# Insert many records efficiently
users = [
    User(email="user1@example.com", full_name="User 1"),
    User(email="user2@example.com", full_name="User 2"),
    User(email="user3@example.com", full_name="User 3"),
]

db.add_all(users)
await db.commit()
```

---

## 15. YouTube Learning Resources

### PostgreSQL Basics
- Search: `"PostgreSQL tutorial for beginners 2024"`
- Search: `"PostgreSQL crash course"`
- Search: `"Learn PostgreSQL in 1 hour"`

### SQL Fundamentals
- Search: `"SQL tutorial complete course"`
- Search: `"SQL for beginners"`
- Channel: **freeCodeCamp** - SQL tutorials

### SQLAlchemy
- Search: `"SQLAlchemy 2.0 tutorial"`
- Search: `"SQLAlchemy async tutorial"`
- Search: `"FastAPI SQLAlchemy tutorial"`

### Database Design
- Search: `"Database design tutorial"`
- Search: `"Database normalization explained"`
- Search: `"Entity relationship diagram tutorial"`

### Advanced Topics
- Search: `"PostgreSQL performance tuning"`
- Search: `"PostgreSQL indexes explained"`
- Search: `"Database transactions ACID"`

### Docker + PostgreSQL
- Search: `"Docker PostgreSQL tutorial"`
- Search: `"Docker Compose PostgreSQL"`

---

## 16. Hands-On Exercises

### Exercise 1: Connect and Explore

```bash
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Connect to database
docker exec -it lundo-postgres psql -U postgres -d child_therapist

# 3. Explore tables
\dt                    # List tables
\d users               # Describe users table
SELECT * FROM users;   # View data
\q                     # Quit
```

### Exercise 2: Write Raw SQL

```sql
-- Create a test user
INSERT INTO users (email, full_name, is_active, is_verified, created_at, updated_at)
VALUES ('test@example.com', 'Test User', true, false, NOW(), NOW());

-- Find the user
SELECT * FROM users WHERE email = 'test@example.com';

-- Update the user
UPDATE users SET is_verified = true WHERE email = 'test@example.com';

-- Delete the user
DELETE FROM users WHERE email = 'test@example.com';
```

### Exercise 3: Add a New Model

Create a `Note` model for parents:

```python
# app/models/note.py
class Note(Base):
    __tablename__ = "notes"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)

    user: Mapped["User"] = relationship("User", back_populates="notes")
```

Then:
1. Add `notes` relationship to User model
2. Create migration: `alembic revision --autogenerate -m "add notes table"`
3. Run migration: `alembic upgrade head`
4. Create CRUD endpoints

### Exercise 4: Query Optimization

```python
# Slow: N+1 query problem
users = await db.execute(select(User))
for user in users.scalars():
    print(user.children)  # Each access = new query!

# Fast: Eager loading
users = await db.execute(
    select(User).options(selectinload(User.children))
)
for user in users.scalars():
    print(user.children)  # Already loaded!
```

### Exercise 5: Implement Pagination

Add pagination to the children endpoint:

```python
@router.get("/")
async def list_children(
    page: int = 1,
    per_page: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    offset = (page - 1) * per_page

    result = await db.execute(
        select(Child)
        .where(Child.parent_id == current_user.id)
        .offset(offset)
        .limit(per_page)
    )

    return {
        "page": page,
        "per_page": per_page,
        "children": result.scalars().all()
    }
```

---

## Quick Reference

### SQL to SQLAlchemy Cheat Sheet

| SQL | SQLAlchemy |
|-----|------------|
| `SELECT *` | `select(Model)` |
| `SELECT col1, col2` | `select(Model.col1, Model.col2)` |
| `WHERE x = 1` | `.where(Model.x == 1)` |
| `WHERE x > 1` | `.where(Model.x > 1)` |
| `WHERE x IN (1,2)` | `.where(Model.x.in_([1, 2]))` |
| `WHERE x LIKE '%a%'` | `.where(Model.x.like('%a%'))` |
| `WHERE x IS NULL` | `.where(Model.x.is_(None))` |
| `AND` | `.where(cond1, cond2)` or `and_(c1, c2)` |
| `OR` | `or_(cond1, cond2)` |
| `ORDER BY x DESC` | `.order_by(desc(Model.x))` |
| `LIMIT 10` | `.limit(10)` |
| `OFFSET 20` | `.offset(20)` |
| `JOIN` | `.join(OtherModel)` |
| `COUNT(*)` | `select(func.count(Model.id))` |
| `GROUP BY` | `.group_by(Model.col)` |

### Common Commands

```bash
# Docker
docker-compose up -d postgres     # Start
docker-compose logs postgres      # View logs
docker-compose down               # Stop

# Alembic
alembic upgrade head              # Apply migrations
alembic downgrade -1              # Rollback one
alembic revision --autogenerate -m "msg"  # Create migration

# psql
\dt                               # List tables
\d tablename                      # Describe table
\q                                # Quit
```

### Connection String Format

```
postgresql+asyncpg://user:password@host:port/database

Example:
postgresql+asyncpg://postgres:postgres@localhost:5433/child_therapist
```

---

## Next Steps

1. **Start PostgreSQL** and explore with psql
2. **Read the models** in `app/models/`
3. **Trace a request** from route → model → database
4. **Create a migration** for a small change
5. **Write custom queries** using SQLAlchemy

Good luck learning PostgreSQL! 🐘
