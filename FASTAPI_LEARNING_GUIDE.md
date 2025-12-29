# FastAPI Backend Learning Guide - Lundo Project

This guide will teach you FastAPI by walking through the Lundo backend. Each section builds on the previous one, so read in order.

---

## Table of Contents

1. [What is FastAPI?](#1-what-is-fastapi)
2. [Project Structure Overview](#2-project-structure-overview)
3. [The Entry Point: main.py](#3-the-entry-point-mainpy)
4. [Configuration Management](#4-configuration-management)
5. [Database Fundamentals](#5-database-fundamentals)
6. [Pydantic Schemas](#6-pydantic-schemas)
7. [Dependency Injection](#7-dependency-injection)
8. [API Routes](#8-api-routes)
9. [Authentication System](#9-authentication-system)
10. [Services Layer](#10-services-layer)
11. [Error Handling](#11-error-handling)
12. [Agent Integration](#12-agent-integration)
13. [Background Tasks](#13-background-tasks)
14. [YouTube Learning Resources](#14-youtube-learning-resources)
15. [Hands-On Exercises](#15-hands-on-exercises)

---

## 1. What is FastAPI?

FastAPI is a modern Python web framework for building APIs. Think of it as the "waiter" between your frontend and database.

```
Frontend (React) ──HTTP Request──> FastAPI ──Query──> Database
                 <──JSON Response──        <──Data──
```

### Why FastAPI?

| Feature | Benefit |
|---------|---------|
| **Type hints** | Automatic validation and documentation |
| **Async support** | Handle thousands of requests simultaneously |
| **Auto documentation** | Swagger UI generated automatically |
| **Fast** | One of the fastest Python frameworks |

### Basic Example

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/hello")
def say_hello():
    return {"message": "Hello World"}
```

This creates an API endpoint at `GET /hello` that returns JSON.

---

## 2. Project Structure Overview

```
app/
├── main.py              # App initialization (START HERE)
├── config.py            # Settings from .env file
├── dependencies.py      # Shared logic (auth, database)
│
├── api/v1/              # HTTP endpoints (routes)
│   ├── auth.py          # Login, register
│   ├── children.py      # Child CRUD
│   ├── conversations.py # Chat endpoints
│   └── memories.py      # AI memory queries
│
├── models/              # Database tables (SQLAlchemy)
│   ├── user.py
│   ├── child.py
│   ├── conversation.py
│   └── message.py
│
├── schemas/             # Request/Response validation (Pydantic)
│   ├── auth.py
│   ├── child.py
│   └── conversation.py
│
├── database/            # Database connection
│   ├── session.py       # Connection pool
│   └── base.py          # Base model class
│
├── services/            # Business logic
│   ├── agent_service.py # AI message processing
│   └── firebase.py      # Firebase authentication
│
├── utils/               # Helper functions
│   └── security.py      # Password hashing, JWT tokens
│
├── agents/              # AI agents (LangChain)
├── workflow/            # AI workflow (LangGraph)
└── memory/              # AI memory system
```

### How They Connect

```
Request → Route (api/v1/) → Schema validation → Service → Model → Database
                                                    ↓
Response ← Schema formatting ← Service result ←────┘
```

---

## 3. The Entry Point: main.py

**File:** `app/main.py`

This is where your FastAPI application starts. Let's break it down:

### 3.1 Creating the App

```python
from fastapi import FastAPI

app = FastAPI(
    title="Lundo API",           # Shows in docs
    description="AI-powered...", # Shows in docs
    version="1.0.0",
    docs_url="/api/v1/docs",     # Swagger UI location
    redoc_url="/api/v1/redoc"    # ReDoc location
)
```

### 3.2 Lifespan Events (Startup/Shutdown)

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP: Runs when app starts
    print("Starting up...")
    init_firebase()  # Initialize services

    yield  # App runs here

    # SHUTDOWN: Runs when app stops
    print("Shutting down...")
    # Cleanup resources

app = FastAPI(lifespan=lifespan)
```

### 3.3 CORS Middleware

CORS (Cross-Origin Resource Sharing) allows your frontend to talk to your backend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],   # Allow all HTTP methods
    allow_headers=["*"]    # Allow all headers
)
```

**Why needed?** Browsers block requests from different origins by default (security).

### 3.4 Registering Routes

```python
from app.api.v1 import auth, children, conversations

app.include_router(
    auth.router,
    prefix="/api/v1/auth",     # All routes start with /api/v1/auth
    tags=["Authentication"]    # Groups in Swagger docs
)

app.include_router(
    children.router,
    prefix="/api/v1/children",
    tags=["Children"]
)
```

### 3.5 Health Check Endpoint

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.api_version,
        "environment": settings.app_env
    }
```

---

## 4. Configuration Management

**File:** `app/config.py`

Never hardcode secrets! Use environment variables.

### 4.1 Pydantic Settings

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Pydantic reads these from .env file or environment
    model_config = SettingsConfigDict(
        env_file=".env",        # Load from .env file
        case_sensitive=False,   # DATABASE_URL = database_url
        extra="ignore"          # Ignore unknown variables
    )

    # Application
    app_name: str = "Lundo"
    app_env: str = "development"
    debug: bool = False

    # Database
    database_url: str  # Required - no default

    # Secrets
    secret_key: str
    jwt_secret_key: str

    # External Services
    azure_openai_api_key: str
    firebase_credentials_path: str = "firebase-credentials.json"

# Create global settings instance
settings = Settings()
```

### 4.2 Using Settings

```python
from app.config import settings

# Anywhere in your code:
if settings.debug:
    print("Debug mode enabled")

database_url = settings.database_url
```

### 4.3 Example .env File

```env
# .env
APP_NAME=Lundo
APP_ENV=development
DEBUG=true

DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5433/lundo

SECRET_KEY=your-super-secret-key
JWT_SECRET_KEY=your-jwt-secret

AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
```

---

## 5. Database Fundamentals

### 5.1 What is SQLAlchemy?

SQLAlchemy is an ORM (Object-Relational Mapper). Instead of writing SQL:

```sql
INSERT INTO users (email, name) VALUES ('john@example.com', 'John');
```

You write Python:

```python
user = User(email="john@example.com", name="John")
db.add(user)
await db.commit()
```

### 5.2 Database Session

**File:** `app/database/session.py`

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Create connection pool (reuses connections)
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,    # Print SQL queries in debug mode
    pool_size=10,           # Keep 10 connections ready
    max_overflow=20         # Allow 20 more if busy
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False  # Keep objects usable after commit
)

# Dependency for routes
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session           # Give session to route
            await session.commit()  # Save changes
        except Exception:
            await session.rollback()  # Undo on error
            raise
```

### 5.3 Base Model

**File:** `app/database/base.py`

All models inherit common fields:

```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func

class Base(DeclarativeBase):
    # Every table gets these columns
    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()  # Database sets this
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()  # Auto-update on changes
    )
```

### 5.4 Model Examples

**File:** `app/models/user.py`

```python
from app.database.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String

class User(Base):
    __tablename__ = "users"  # Table name in database

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)
    firebase_uid: Mapped[str | None] = mapped_column(String(128), unique=True)

    # Relationship: User has many Children
    children: Mapped[list["Child"]] = relationship(
        "Child",
        back_populates="parent",
        cascade="all, delete-orphan"  # Delete children when user deleted
    )
```

**File:** `app/models/child.py`

```python
class Child(Base):
    __tablename__ = "children"

    parent_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(255))
    date_of_birth: Mapped[date]
    gender: Mapped[str | None] = mapped_column(String(50))
    notes: Mapped[str | None] = mapped_column(Text)

    # Relationship back to User
    parent: Mapped["User"] = relationship("User", back_populates="children")

    # Computed property (not stored in database)
    @property
    def age_years(self) -> int:
        today = date.today()
        return today.year - self.date_of_birth.year
```

### 5.5 Common Database Operations

```python
from sqlalchemy import select
from app.models.user import User

# CREATE
new_user = User(email="john@example.com", full_name="John")
db.add(new_user)
await db.commit()

# READ - Single item
result = await db.execute(
    select(User).where(User.email == "john@example.com")
)
user = result.scalar_one_or_none()  # Returns User or None

# READ - Multiple items
result = await db.execute(
    select(User).where(User.is_active == True)
)
users = result.scalars().all()  # Returns list of Users

# UPDATE
user.full_name = "John Doe"
await db.commit()

# DELETE
await db.delete(user)
await db.commit()
```

---

## 6. Pydantic Schemas

Schemas define what data looks like. They validate input and format output.

### 6.1 Why Schemas?

```
Client sends JSON → Schema validates → Route processes → Schema formats → JSON response
```

### 6.2 Request Schemas (Input Validation)

**File:** `app/schemas/child.py`

```python
from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class ChildCreate(BaseModel):
    """Schema for creating a child"""
    name: str = Field(..., min_length=1, max_length=255)  # Required
    date_of_birth: date
    gender: Optional[str] = None  # Optional
    notes: Optional[str] = None

class ChildUpdate(BaseModel):
    """Schema for updating a child - all fields optional"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    notes: Optional[str] = None
```

### 6.3 Response Schemas (Output Formatting)

```python
class ChildResponse(BaseModel):
    """Schema for returning child data"""
    id: int
    name: str
    date_of_birth: date
    gender: Optional[str]
    notes: Optional[str]
    age_years: int  # Computed from model property
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True  # Convert SQLAlchemy model to schema
```

### 6.4 Using Schemas in Routes

```python
@router.post("/children", response_model=ChildResponse)
async def create_child(
    child_data: ChildCreate,  # FastAPI validates request body
    db: AsyncSession = Depends(get_db)
):
    # child_data is already validated
    child = Child(
        name=child_data.name,
        date_of_birth=child_data.date_of_birth
    )
    db.add(child)
    await db.commit()

    return child  # FastAPI converts to ChildResponse JSON
```

### 6.5 Validation Examples

```python
from pydantic import BaseModel, Field, field_validator

class UserRegister(BaseModel):
    email: str
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=1)

    @field_validator('email')
    @classmethod
    def email_must_be_valid(cls, v):
        if '@' not in v:
            raise ValueError('Invalid email format')
        return v.lower()  # Normalize to lowercase
```

---

## 7. Dependency Injection

Dependencies are reusable logic that FastAPI automatically runs before your route.

### 7.1 Basic Concept

```python
from fastapi import Depends

# Define a dependency
def get_query_limit(limit: int = 10):
    if limit > 100:
        return 100
    return limit

# Use in route
@router.get("/items")
def get_items(limit: int = Depends(get_query_limit)):
    # limit is automatically provided by the dependency
    return {"limit": limit}
```

### 7.2 Database Dependency

```python
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

@router.get("/users")
async def get_users(db: AsyncSession = Depends(get_db)):
    # db session is provided, committed/rolled back automatically
    result = await db.execute(select(User))
    return result.scalars().all()
```

### 7.3 Authentication Dependency

**File:** `app/dependencies.py`

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()  # Expects "Authorization: Bearer <token>"

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    This dependency:
    1. Extracts token from Authorization header
    2. Verifies the token (Firebase or JWT)
    3. Looks up the user in database
    4. Returns the User object or raises 401
    """
    token = credentials.credentials

    # Try Firebase token
    firebase_claims = verify_firebase_token(token)
    if firebase_claims:
        user = await db.execute(
            select(User).where(User.firebase_uid == firebase_claims["uid"])
        )
        user = user.scalar_one_or_none()
        if user:
            return user

    # Try JWT token
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        user = await db.execute(
            select(User).where(User.id == int(user_id))
        )
        user = user.scalar_one_or_none()
        if user and user.is_active:
            return user
    except:
        pass

    raise HTTPException(status_code=401, detail="Invalid credentials")
```

### 7.4 Using Auth Dependency

```python
@router.get("/me")
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    # current_user is guaranteed to be authenticated
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.full_name
    }
```

### 7.5 Dependency Chain

Dependencies can depend on other dependencies:

```
Route
  └── get_current_user
        ├── security (HTTPBearer) → extracts token
        └── get_db → provides database session
```

---

## 8. API Routes

Routes define HTTP endpoints. Each file in `api/v1/` handles related endpoints.

### 8.1 Router Setup

**File:** `app/api/v1/children.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()  # Create router for this module
```

### 8.2 CRUD Operations

**CREATE - POST**

```python
@router.post("/", response_model=ChildResponse, status_code=201)
async def create_child(
    child_data: ChildCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new child profile"""
    child = Child(
        parent_id=current_user.id,
        name=child_data.name,
        date_of_birth=child_data.date_of_birth,
        gender=child_data.gender,
        notes=child_data.notes
    )
    db.add(child)
    await db.commit()
    await db.refresh(child)  # Get auto-generated fields (id, timestamps)

    return child
```

**READ - GET (List)**

```python
@router.get("/", response_model=list[ChildResponse])
async def list_children(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all children for current user"""
    result = await db.execute(
        select(Child)
        .where(Child.parent_id == current_user.id)
        .order_by(Child.name)
    )
    return result.scalars().all()
```

**READ - GET (Single)**

```python
@router.get("/{child_id}", response_model=ChildResponse)
async def get_child(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific child by ID"""
    result = await db.execute(
        select(Child).where(
            Child.id == child_id,
            Child.parent_id == current_user.id  # Ownership check!
        )
    )
    child = result.scalar_one_or_none()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    return child
```

**UPDATE - PUT**

```python
@router.put("/{child_id}", response_model=ChildResponse)
async def update_child(
    child_id: int,
    child_data: ChildUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a child's information"""
    # Get existing child
    result = await db.execute(
        select(Child).where(
            Child.id == child_id,
            Child.parent_id == current_user.id
        )
    )
    child = result.scalar_one_or_none()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Update only provided fields
    update_data = child_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(child, field, value)

    await db.commit()
    await db.refresh(child)

    return child
```

**DELETE - DELETE**

```python
@router.delete("/{child_id}", status_code=204)
async def delete_child(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a child profile"""
    result = await db.execute(
        select(Child).where(
            Child.id == child_id,
            Child.parent_id == current_user.id
        )
    )
    child = result.scalar_one_or_none()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    await db.delete(child)
    await db.commit()

    return None  # 204 No Content
```

### 8.3 Path and Query Parameters

```python
# Path parameter: /children/5
@router.get("/{child_id}")
async def get_child(child_id: int):  # Extracted from URL
    pass

# Query parameters: /children?limit=10&sort=name
@router.get("/")
async def list_children(
    limit: int = 10,           # Default value
    sort: str = "created_at",
    active_only: bool = True
):
    pass
```

### 8.4 Request Body

```python
@router.post("/")
async def create_item(
    item: ItemCreate  # JSON body parsed into Pydantic model
):
    pass
```

---

## 9. Authentication System

### 9.1 Password Hashing

**File:** `app/utils/security.py`

```python
from passlib.context import CryptContext

# bcrypt is the industry standard for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash a plain password"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if password matches hash"""
    return pwd_context.verify(plain_password, hashed_password)
```

### 9.2 JWT Tokens

```python
from jose import jwt
from datetime import datetime, timedelta

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()

    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=60))
    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm="HS256"
    )

def decode_token(token: str) -> dict:
    """Decode and verify a JWT token"""
    return jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=["HS256"]
    )
```

### 9.3 Registration Flow

```python
@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    # Check if email already exists
    existing = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    # Create user with hashed password
    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name
    )
    db.add(user)
    await db.commit()

    return user
```

### 9.4 Login Flow

```python
@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    # Find user
    result = await db.execute(
        select(User).where(User.email == credentials.email)
    )
    user = result.scalar_one_or_none()

    # Verify password
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(401, "Incorrect email or password")

    # Create tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
```

### 9.5 Firebase Authentication

Firebase handles OAuth (Google, Apple, etc.) on the frontend. Backend just verifies:

```python
import firebase_admin
from firebase_admin import auth

def verify_firebase_token(id_token: str) -> dict | None:
    """Verify Firebase ID token from client"""
    try:
        decoded = auth.verify_id_token(id_token)
        return decoded  # Contains: uid, email, email_verified, name
    except Exception:
        return None

@router.post("/firebase", response_model=Token)
async def firebase_auth(
    firebase_data: FirebaseAuth,
    db: AsyncSession = Depends(get_db)
):
    # Verify token with Firebase
    claims = verify_firebase_token(firebase_data.id_token)
    if not claims:
        raise HTTPException(401, "Invalid Firebase token")

    # Find or create user
    user = await db.execute(
        select(User).where(User.firebase_uid == claims["uid"])
    )
    user = user.scalar_one_or_none()

    if not user:
        # Create new user from Firebase data
        user = User(
            email=claims["email"],
            full_name=claims.get("name", ""),
            firebase_uid=claims["uid"],
            is_verified=claims.get("email_verified", False)
        )
        db.add(user)
        await db.commit()

    # Return JWT tokens for API access
    return {
        "access_token": create_access_token({"sub": str(user.id)}),
        "refresh_token": create_refresh_token({"sub": str(user.id)}),
        "token_type": "bearer"
    }
```

---

## 10. Services Layer

Services contain business logic, keeping routes clean.

### 10.1 Why Services?

**Without services (bad):**
```python
@router.post("/messages")
async def send_message(content: str, db: AsyncSession):
    # 50 lines of message processing, AI calls, database operations...
    pass
```

**With services (good):**
```python
@router.post("/messages")
async def send_message(content: str, db: AsyncSession):
    return await agent_service.send_message(db, conversation_id, content)
```

### 10.2 Agent Service Example

**File:** `app/services/agent_service.py`

```python
class AgentService:
    """Handles AI message processing"""

    async def create_conversation(
        self,
        db: AsyncSession,
        child_id: int,
        user_id: int,
        initial_message: str = None
    ) -> dict:
        """Create a new conversation"""
        # Generate unique thread ID for LangGraph
        thread_id = f"thread_{child_id}_{uuid.uuid4().hex[:8]}"

        # Create conversation
        conversation = Conversation(
            child_id=child_id,
            user_id=user_id,
            thread_id=thread_id,
            title="New Conversation"
        )
        db.add(conversation)
        await db.commit()

        # If initial message provided, process it
        if initial_message:
            return await self.send_message(db, conversation.id, user_id, initial_message)

        return {"conversation_id": conversation.id}

    async def send_message(
        self,
        db: AsyncSession,
        conversation_id: int,
        user_id: int,
        content: str
    ) -> dict:
        """Process a message through AI"""
        # Save user message
        user_message = Message(
            conversation_id=conversation_id,
            role="user",
            content=content
        )
        db.add(user_message)

        # Get child info for context
        conversation = await self._get_conversation(db, conversation_id)
        child = conversation.child

        # Call AI supervisor
        result = await supervisor.process_message(
            child_id=child.id,
            child_age=child.age_years,
            thread_id=conversation.thread_id,
            user_message=content
        )

        # Save AI response
        ai_message = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=result["response"]
        )
        db.add(ai_message)
        await db.commit()

        return {
            "message_id": ai_message.id,
            "content": result["response"],
            "safety_flags": result.get("safety_flags", [])
        }
```

### 10.3 Using Services in Routes

```python
from app.services.agent_service import AgentService

agent_service = AgentService()

@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: int,
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Route is clean - just validates and delegates
    return await agent_service.send_message(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
        content=message.content
    )
```

---

## 11. Error Handling

### 11.1 HTTP Exceptions

```python
from fastapi import HTTPException

# 400 Bad Request - Invalid input
raise HTTPException(status_code=400, detail="Invalid email format")

# 401 Unauthorized - Not authenticated
raise HTTPException(status_code=401, detail="Invalid credentials")

# 403 Forbidden - No permission
raise HTTPException(status_code=403, detail="You don't own this resource")

# 404 Not Found - Resource doesn't exist
raise HTTPException(status_code=404, detail="Child not found")

# 500 Internal Server Error - Something broke
raise HTTPException(status_code=500, detail="Database connection failed")
```

### 11.2 Global Exception Handler

```python
# In main.py
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")

    if settings.debug:
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc)}  # Show error in debug
        )

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}  # Hide in production
    )
```

### 11.3 Validation Errors

Pydantic automatically returns 422 Unprocessable Entity:

```json
{
    "detail": [
        {
            "loc": ["body", "email"],
            "msg": "value is not a valid email address",
            "type": "value_error.email"
        }
    ]
}
```

---

## 12. Agent Integration

This project integrates AI agents using LangChain and LangGraph.

### 12.1 Supervisor Agent

**File:** `app/agents/supervisor.py`

The supervisor coordinates multiple AI agents:

```python
class SupervisorAgent:
    async def process_message(
        self,
        child_id: int,
        child_age: int,
        thread_id: str,
        user_message: str
    ) -> dict:
        """
        1. Analyze parent's concern
        2. Route to specialist agents
        3. Combine their insights
        4. Check safety
        5. Return formatted response
        """

        # Run the workflow
        result = await run_therapist_workflow(
            child_id=child_id,
            child_age=child_age,
            thread_id=thread_id,
            user_message=user_message
        )

        return {
            "response": result["final_response"],
            "safety_flags": result["safety_flags"],
            "requires_human_review": result["requires_human_review"]
        }
```

### 12.2 Workflow Graph

**File:** `app/workflow/graph.py`

LangGraph creates a state machine:

```python
from langgraph.graph import StateGraph

def create_therapist_workflow():
    graph = StateGraph(TherapistState)

    # Add nodes (processing steps)
    graph.add_node("parse_input", parse_input_node)
    graph.add_node("analyze_behavior", behavior_analyst_node)
    graph.add_node("get_recommendations", material_consultant_node)
    graph.add_node("synthesize", synthesize_response_node)
    graph.add_node("safety_check", safety_check_node)

    # Define edges (flow)
    graph.add_edge("parse_input", "analyze_behavior")
    graph.add_edge("analyze_behavior", "get_recommendations")
    graph.add_edge("get_recommendations", "synthesize")
    graph.add_edge("synthesize", "safety_check")

    return graph.compile()
```

### 12.3 Streaming Responses

```python
from fastapi.responses import StreamingResponse

@router.post("/{conversation_id}/messages/stream")
async def stream_message(
    conversation_id: int,
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    async def generate():
        async for chunk in agent_service.send_message_stream(
            db, conversation_id, current_user.id, message.content
        ):
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )
```

---

## 13. Background Tasks

For long-running operations, use Celery with Redis.

### 13.1 Celery Setup

```python
from celery import Celery

celery_app = Celery(
    "worker",
    broker=settings.celery_broker_url,      # Redis URL
    backend=settings.celery_result_backend   # Redis URL
)

@celery_app.task
def extract_memories_task(conversation_id: int):
    """Background task to extract memories from conversation"""
    # Long-running AI analysis
    pass
```

### 13.2 Triggering Background Tasks

```python
@router.post("/messages")
async def send_message(...):
    # ... process message ...

    # Trigger background task (non-blocking)
    extract_memories_task.delay(conversation.id)

    return response
```

### 13.3 FastAPI Background Tasks (Simple)

For simpler tasks, use FastAPI's built-in background tasks:

```python
from fastapi import BackgroundTasks

@router.post("/messages")
async def send_message(
    background_tasks: BackgroundTasks,
    ...
):
    response = await process_message()

    # Run after response is sent
    background_tasks.add_task(log_message, message_id=response["id"])

    return response
```

---

## 14. YouTube Learning Resources

### FastAPI Fundamentals
- Search: `"FastAPI full course 2024"`
- Search: `"FastAPI tutorial for beginners"`
- Channel: **ArjanCodes** - FastAPI best practices

### SQLAlchemy & Databases
- Search: `"SQLAlchemy 2.0 tutorial"`
- Search: `"SQLAlchemy async tutorial"`
- Search: `"PostgreSQL for beginners"`

### Pydantic
- Search: `"Pydantic v2 tutorial"`
- Search: `"Pydantic validation FastAPI"`

### Authentication
- Search: `"FastAPI JWT authentication"`
- Search: `"Firebase authentication Python"`

### Docker
- Search: `"Docker for Python developers"`
- Search: `"Docker Compose tutorial"`

### LangChain/LangGraph
- Search: `"LangChain tutorial 2024"`
- Search: `"LangGraph tutorial"`
- Channel: **LangChain** official

### Async Python
- Search: `"Python async await explained"`
- Search: `"asyncio tutorial"`

---

## 15. Hands-On Exercises

### Exercise 1: Add a Simple Endpoint

Add a `GET /api/v1/stats` endpoint that returns user statistics.

```python
# In app/api/v1/stats.py
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user, get_db

router = APIRouter()

@router.get("/")
async def get_stats(
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    # TODO: Count user's children and conversations
    return {
        "children_count": 0,
        "conversations_count": 0
    }
```

### Exercise 2: Add Input Validation

Create a schema that validates:
- Email must contain `@`
- Password must be 8+ characters with at least one number
- Age must be between 0 and 18

### Exercise 3: Add a New Model

Add a `Note` model that belongs to a Child:
- Fields: title, content, created_at
- Create CRUD endpoints
- Add proper schemas

### Exercise 4: Add Query Parameters

Modify the list endpoints to support:
- Pagination: `?page=1&per_page=10`
- Sorting: `?sort_by=name&order=asc`
- Filtering: `?active=true`

### Exercise 5: Add a Service

Create a `StatisticsService` that:
- Calculates average response time
- Counts messages per day
- Returns most common topics

---

## Quick Reference

### HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST (new resource) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable | Validation failed |
| 500 | Server Error | Something broke |

### Common Patterns

```python
# Dependency injection
def my_dependency():
    return "value"

@app.get("/")
def route(value: str = Depends(my_dependency)):
    pass

# Path parameters
@app.get("/items/{item_id}")
def get_item(item_id: int):
    pass

# Query parameters
@app.get("/items")
def list_items(limit: int = 10, offset: int = 0):
    pass

# Request body
@app.post("/items")
def create_item(item: ItemCreate):
    pass

# Response model
@app.get("/items", response_model=list[ItemResponse])
def list_items():
    pass
```

---

## Next Steps

1. **Run the API locally** and explore Swagger docs at `/api/v1/docs`
2. **Read the code files** in order: main.py → config.py → models → schemas → routes
3. **Make small changes** and see what happens
4. **Add a new endpoint** as practice
5. **Study the agent integration** once comfortable with basics

Good luck learning FastAPI! 🚀
