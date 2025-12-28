# Lundo

**AI-Powered Child Behavioral Therapist for Parents**

A production-ready multi-agent system that provides empathetic, evidence-based behavioral guidance using LangGraph, Azure OpenAI, and a sophisticated memory system.

---

## What is Lundo?

Lundo is an AI assistant that helps parents navigate challenging child behaviors with professional-grade guidance. It combines:

- **Multi-Agent Architecture** - Specialized AI agents working together
- **Persistent Memory** - Remembers your child's history across sessions
- **Evidence-Based Guidance** - Grounded in developmental psychology and behavioral science
- **Safety-First Design** - Content filtering and professional referral triggers
- **Age-Appropriate Recommendations** - Books, activities, and strategies filtered by child's age

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [The Agent System](#the-agent-system)
4. [Memory System](#memory-system)
5. [LangGraph Workflow](#langgraph-workflow)
6. [Safety Features](#safety-features)
7. [API Reference](#api-reference)
8. [Frontend](#frontend)
9. [Database Models](#database-models)
10. [Configuration](#configuration)
11. [Development](#development)
12. [Tech Stack](#tech-stack)

---

## Quick Start

### Using Docker (Recommended)

```bash
# 1. Clone and setup
git clone https://github.com/your-repo/lundo.git
cd lundo
cp .env.docker.example .env

# 2. Edit .env with your credentials
#    - AZURE_OPENAI_* (required)
#    - FIREBASE_PROJECT_ID (required)
#    - SECRET_KEY, JWT_SECRET_KEY (generate secure values)

# 3. Add Firebase credentials
cp your-firebase-credentials.json ./firebase-credentials.json

# 4. Start services
docker-compose up -d

# 5. Access
# API:      http://localhost:8080
# API Docs: http://localhost:8080/docs
# Frontend: http://localhost:3000
```

### Local Development

```bash
# Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start dependencies
docker-compose up -d postgres redis chroma_db

# Run migrations & start server
alembic upgrade head
uvicorn app.main:app --reload --port 8080

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

---

## Architecture Overview

```
                              PARENT
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│   React + TypeScript + Tailwind                                 │
│   - Auth (Firebase)  - Chat Interface  - Children Management    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         FASTAPI                                  │
│   /auth  /children  /conversations  /memories  /interrupts     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPERVISOR AGENT                              │
│                                                                  │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│
│   │  Behavior   │  │  Material   │  │    Psychological        ││
│   │  Analyst    │  │  Consultant │  │    Perspectives         ││
│   └─────────────┘  └─────────────┘  └─────────────────────────┘│
│                                                                  │
│   ┌─────────────────────────────────────────────────────────────┐│
│   │              LANGGRAPH WORKFLOW (8 Nodes)                   ││
│   │  parse → route → analyze → psychology → materials →        ││
│   │  synthesize → safety_check → format                        ││
│   └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────────┐
│  PostgreSQL  │      │    Redis     │      │    ChromaDB      │
│  - Users     │      │  - Cache     │      │  - Books         │
│  - Children  │      │  - Sessions  │      │  - Activities    │
│  - Messages  │      │              │      │  - Strategies    │
│  - Memories  │      │              │      │                  │
└──────────────┘      └──────────────┘      └──────────────────┘
```

---

## The Agent System

### Supervisor Agent

The brain of the system. Located at `app/agents/supervisor.py`.

**Responsibilities:**
- Orchestrates the LangGraph workflow
- Coordinates subagents
- Extracts and stores memories using structured LLM output
- Handles conversation state

```python
# Memory extraction uses structured output
class ExtractedMemory(BaseModel):
    life_events: List[ExtractedLifeEvent]    # death, divorce, moving, etc.
    behaviors: List[ExtractedBehavior]        # specific concerns
    family_context: List[ExtractedFamilyContext]
    emotional_triggers: List[str]
    should_remember: bool                     # LLM decides importance
```

### Subagents

| Agent | File | Purpose |
|-------|------|---------|
| **Behavior Analyst** | `app/agents/subagents/behavior_analyst.py` | Analyzes patterns, searches child history, considers life events |
| **Material Consultant** | `app/agents/subagents/material_consultant.py` | RAG search for books, activities, strategies (age-filtered) |

### Psychological Skills

Modular frameworks loaded on-demand based on relevance:

| Skill | File | Framework |
|-------|------|-----------|
| **Developmental Psychology** | `app/agents/skills/developmental_psychology.py` | Piaget's stages, Erikson's development, age norms |
| **Behaviorist** | `app/agents/skills/behaviorist.py` | Operant conditioning, ABC model, reinforcement |

---

## Memory System

Lundo uses a **dual-layer memory architecture**:

### Short-Term Memory (Conversation State)

- Managed by LangGraph's `AsyncPostgresSaver`
- Thread-scoped (per conversation)
- Stores message history and workflow state
- Auto-managed, no manual intervention needed

### Long-Term Memory (Persistent Knowledge)

- Stored in PostgreSQL with vector embeddings
- Child-scoped (persists across conversations)
- Semantic search enabled
- GDPR-compliant deletion

**What Gets Remembered:**

| Memory Type | Examples |
|------------|----------|
| `life_events` | Death in family, divorce, moving, new sibling |
| `behavioral_patterns` | Sleep issues, tantrums, anxiety triggers |
| `family_context` | Single parent, siblings, living situation |
| `successful_interventions` | What worked before |
| `developmental_milestones` | Walking, talking, social skills |
| `emotional_triggers` | What causes reactions |

**Memory Schemas** (`app/memory/schemas.py`):

```python
class BehavioralPattern:
    behavior: str           # "Difficulty falling asleep"
    context: str            # "At bedtime, especially after screen time"
    triggers: List[str]     # ["screen time", "sugar", "late naps"]
    frequency: str          # "daily", "weekly", "occasional"
    severity: str           # "mild", "moderate", "severe"
    first_observed: datetime
    last_observed: datetime

class TimelineEvent:
    event: str              # "Parents divorced"
    category: str           # "life_change", "medical", "school"
    impact: str             # "Increased anxiety, regression in behavior"
    date: datetime
```

---

## LangGraph Workflow

The 8-node pipeline that processes every message:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  1. PARSE INPUT                                              │
│     └─ Extract concern, detect emotional state               │
│                                                              │
│  2. ROUTE TO AGENTS                                          │
│     └─ Decide which subagents/skills to invoke               │
│                                                              │
│  3. CALL BEHAVIOR ANALYST                                    │
│     └─ Search history, analyze patterns, consider events     │
│                                                              │
│  4. APPLY PSYCHOLOGICAL PERSPECTIVE                          │
│     └─ Load relevant skills, apply theoretical framework     │
│                                                              │
│  5. CALL MATERIAL CONSULTANT                                 │
│     └─ RAG search: books, activities, strategies             │
│                                                              │
│  6. SYNTHESIZE RESPONSE                                      │
│     └─ Combine all insights into cohesive guidance           │
│                                                              │
│  7. SAFETY CHECK                                             │
│     └─ Content filter, add disclaimers, trigger HITL         │
│                                                              │
│  8. FORMAT OUTPUT                                            │
│     └─ Create final response for parent                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Workflow State** (`app/workflow/state.py`):

```python
class TherapistState(TypedDict):
    messages: Sequence[BaseMessage]
    child_id: int
    child_age: int
    parent_id: int
    current_concern: str
    parent_emotional_state: Optional[str]
    behavior_analysis: Optional[str]
    psychological_perspective: Optional[str]
    material_recommendations: Optional[str]
    active_skills: List[str]
    agents_to_call: List[str]
    final_response: Optional[str]
    requires_human_review: bool
    safety_flags: List[str]
```

---

## Safety Features

### Content Detection (`app/safety/triggers.py`)

Automatically detects and flags:

| Category | Examples |
|----------|----------|
| **Medical/Clinical** | ADHD, autism, depression, medication |
| **Harm** | Abuse, self-harm, violence, trauma |
| **Emergency** | Crisis, danger, 911, suicidal |
| **Developmental** | Severe delays, regression |

### Response Handling

1. **Low sensitivity**: Add subtle disclaimer
2. **Medium sensitivity**: Add professional referral notice
3. **High sensitivity**: Trigger Human-in-the-Loop review

### Disclaimers (`app/safety/disclaimers.py`)

Automatically appended when needed:
- Professional consultation recommendations
- Crisis resources (911, 988 mental health line)
- AI limitation acknowledgments

### Human-in-the-Loop (HITL)

When content is flagged as requiring review:

```python
# Workflow interrupts via LangGraph
human_decision = interrupt(review_prompt)

# Admin reviews and decides:
# - "approve": Send as-is
# - "edit": Send modified version
# - "reject": Send safe alternative
```

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new parent account |
| `POST` | `/api/v1/auth/login` | Login with email/password |
| `POST` | `/api/v1/auth/firebase` | Login with Firebase token |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `GET` | `/api/v1/auth/me` | Get current user |

### Children

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/children` | Create child profile |
| `GET` | `/api/v1/children` | List all children |
| `GET` | `/api/v1/children/{id}` | Get child details |
| `PUT` | `/api/v1/children/{id}` | Update child |
| `DELETE` | `/api/v1/children/{id}` | Delete child (GDPR) |

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/conversations` | Start new conversation |
| `GET` | `/api/v1/conversations` | List conversations |
| `GET` | `/api/v1/conversations/{id}` | Get with messages |
| `POST` | `/api/v1/conversations/{id}/messages` | **Send message** |
| `DELETE` | `/api/v1/conversations/{id}` | Delete conversation |

**Send Message Response:**

```json
{
  "message_id": 123,
  "content": "AI response text...",
  "requires_human_review": false,
  "safety_flags": [],
  "metadata": {
    "agents_called": ["behavior_analyst", "material_consultant"],
    "skills_used": ["developmental_psychology"],
    "parent_emotional_state": "worried"
  }
}
```

### Memories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/memories/{child_id}/summary` | Memory overview |
| `POST` | `/api/v1/memories/{child_id}/search` | Semantic search |
| `GET` | `/api/v1/memories/{child_id}/patterns` | Behavioral patterns |
| `GET` | `/api/v1/memories/{child_id}/timeline` | Life events |
| `GET` | `/api/v1/memories/{child_id}/interventions` | What worked |
| `DELETE` | `/api/v1/memories/{child_id}/all` | Delete all (GDPR) |

---

## Frontend

### Structure

```
frontend/src/
├── api/                    # API client modules
│   ├── api.ts              # Axios instance
│   ├── auth.ts             # Auth endpoints
│   ├── children.ts         # Children endpoints
│   └── conversations.ts    # Chat endpoints
├── components/
│   ├── layout/             # Header, Footer, Layout
│   └── ui/                 # Button, Card, Input, etc.
├── config/
│   └── firebase.ts         # Firebase configuration
├── features/
│   ├── auth/               # Login, Register, AuthContext
│   ├── chat/               # ChatPage (main interface)
│   ├── children/           # ChildrenPage (manage profiles)
│   └── dashboard/          # Dashboard (overview)
└── types/                  # TypeScript interfaces
```

### Key Features

- **Authentication**: Email/password + Firebase Google sign-in
- **Dashboard**: Overview of children, recent conversations
- **Children Management**: Create, edit, delete child profiles
- **Chat Interface**: Real-time messaging with typing indicators
- **Responsive Design**: Mobile-first with dark mode support

---

## Database Models

### User (Parent)

```python
class User(Base):
    id: int
    email: str                    # Unique
    hashed_password: Optional[str]  # Null for Firebase users
    full_name: str
    is_active: bool
    is_verified: bool
    firebase_uid: Optional[str]   # For Firebase auth

    children: List[Child]         # Relationship
```

### Child

```python
class Child(Base):
    id: int
    parent_id: int                # FK → User
    name: str
    date_of_birth: date
    gender: Optional[str]
    notes: Optional[str]

    @property
    def age_years(self) -> int    # Computed from DOB

    conversations: List[Conversation]
```

### Conversation

```python
class Conversation(Base):
    id: int
    child_id: int                 # FK → Child
    user_id: int                  # FK → User
    thread_id: str                # LangGraph thread ID (unique)
    title: str                    # Auto-generated
    is_active: bool
    created_at: datetime
    updated_at: datetime

    messages: List[Message]
```

### Message

```python
class Message(Base):
    id: int
    conversation_id: int          # FK → Conversation
    role: str                     # "user" | "assistant" | "system"
    content: str
    extra_data: Optional[str]     # JSON: agent traces, metadata
    created_at: datetime
```

---

## Configuration

### Required Environment Variables

```bash
# Azure OpenAI (Chat Model)
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o  # or your deployment name
AZURE_OPENAI_API_VERSION=2024-12-01-preview

# Azure OpenAI (Embeddings)
AZURE_OPENAI_EMBEDDING_API_KEY=your-embedding-key
AZURE_OPENAI_EMBEDDING_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-large

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5433/lundo
REDIS_URL=redis://localhost:6380/0

# Security (generate secure values!)
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Optional Variables

```bash
# LangSmith (AI observability)
LANGSMITH_API_KEY=your-key
LANGSMITH_PROJECT=lundo
LANGSMITH_TRACING=true

# ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8000

# App Settings
APP_ENV=development
DEBUG=true
LOG_LEVEL=INFO
```

### Generate Secure Keys

```bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate JWT_SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Development

### Project Structure

```
lundo/
├── app/
│   ├── agents/
│   │   ├── supervisor.py          # Main orchestrator
│   │   ├── subagents/
│   │   │   ├── behavior_analyst.py
│   │   │   └── material_consultant.py
│   │   └── skills/
│   │       ├── developmental_psychology.py
│   │       └── behaviorist.py
│   ├── api/v1/                    # API endpoints
│   ├── database/                  # DB setup, migrations
│   ├── memory/                    # Memory system
│   ├── models/                    # SQLAlchemy models
│   ├── safety/                    # Content filtering
│   ├── schemas/                   # Pydantic schemas
│   ├── services/                  # Business logic
│   ├── workflow/                  # LangGraph workflow
│   ├── knowledge_base/            # RAG vector store
│   ├── config.py                  # Settings
│   └── main.py                    # FastAPI app
├── frontend/                      # React app
├── docker/                        # Docker configs
├── tests/                         # Test suites
├── docker-compose.yml
├── requirements.txt
└── alembic.ini
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Add feature X"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Running Tests

```bash
pytest tests/ -v --cov=app
```

### Code Quality

```bash
# Format
black app/ tests/

# Lint
ruff check app/ tests/

# Type check
mypy app/
```

---

## Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **FastAPI** | Web framework |
| **LangGraph** | Agent workflow orchestration |
| **Azure OpenAI** | LLM (chat) + Embeddings |
| **PostgreSQL** | Primary database |
| **Redis** | Caching, session storage |
| **ChromaDB** | Vector store for RAG |
| **SQLAlchemy 2.0** | Async ORM |
| **Pydantic v2** | Data validation |
| **Firebase Admin** | Authentication |

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite 5** | Build tool |
| **Tailwind CSS** | Styling |
| **React Router v6** | Navigation |
| **Axios** | HTTP client |
| **Lucide React** | Icons |
| **Firebase SDK** | Auth client |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Local orchestration |
| **LangSmith** | LLM observability |

---

## Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| `api` | 8080 | FastAPI application |
| `postgres` | 5433 | PostgreSQL database |
| `redis` | 6380 | Cache & queue |
| `chroma_db` | 8000 | Vector store |
| `frontend` | 3000 | React application |
| `worker` | - | Celery background tasks |
| `flower` | 5555 | Celery monitoring UI |

---

## License

MIT

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

---

Built with LangGraph + Azure OpenAI
