# 🧒 Child Behavioral Therapist

A production-ready multi-agent child behavioral therapist system built with LangChain, LangGraph, and FastAPI.

---

## 📖 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Agentic Structure](#agentic-structure)
- [Memory System (Dual-Layer)](#memory-system-dual-layer)
- [RAG Knowledge Base](#rag-knowledge-base)
- [LangGraph Workflow](#langgraph-workflow)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Development](#development)

---

## Overview

This system uses a **supervisor agent architecture** to provide empathetic, expert-informed behavioral guidance for parents. It combines:

- 🤖 **Multi-Agent Orchestration** – Supervisor coordinates specialized subagents
- 🧠 **Dual-Layer Memory** – Short-term conversation state + long-term persistent child history
- 📚 **RAG Knowledge Base** – Vector search over books, activities, and strategies
- 🛡️ **Human-in-the-Loop** – Safety checks for sensitive topics
- 🎭 **Psychological Skills** – Modular frameworks (Developmental, Behaviorist, etc.)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PARENT INPUT                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SUPERVISOR AGENT                                 │
│  • Orchestrates workflow                                                │
│  • Manages conversation state                                           │
│  • Updates long-term memory via LLM extraction                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│  BEHAVIOR ANALYST   │ │   PSYCHOLOGICAL     │ │ MATERIAL CONSULTANT │
│  ─────────────────  │ │   PERSPECTIVE       │ │  ─────────────────  │
│  • Pattern analysis │ │   ─────────────     │ │  • Book search      │
│  • History lookup   │ │   • Skill loading   │ │  • Activity search  │
│  • Life events      │ │   • Framework lens  │ │  • Strategy search  │
│  • Family context   │ │   • Age-appropriate │ │  • Age filtering    │
└──────────┬──────────┘ └──────────┬──────────┘ └──────────┬──────────┘
           │                       │                       │
           │                       │                       │
           │                       │                       │
           ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      SYNTHESIZE + SAFETY CHECK                          │
│  • Combine insights from all subagents                                  │
│  • Apply safety filters and content moderation                          │
│  • Human-in-the-loop interrupt for sensitive content                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      RESPONSE TO PARENT                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Agentic Structure

### Supervisor Agent (`app/agents/supervisor.py`)

The **central orchestrator** that:
1. Receives parent messages and routes them through the workflow
2. Coordinates all subagents via LangGraph
3. Extracts and stores important information to long-term memory using structured LLM output
4. Manages conversation lifecycle

```python
# Memory extraction uses structured output schemas
class ExtractedMemory:
    life_events: List[ExtractedLifeEvent]      # Death, divorce, moving, etc.
    behavioral_patterns: List[ExtractedBehavior]
    family_context: List[ExtractedFamilyContext]
    emotional_triggers: List[str]
    should_remember: bool                       # LLM decides if info is worth storing
```

### Subagents

| Subagent | File | Purpose |
|----------|------|---------|
| **Behavior Analyst** | `app/agents/subagents/behavior_analyst.py` | Analyzes patterns, searches history, retrieves life events and family context |
| **Material Consultant** | `app/agents/subagents/material_consultant.py` | Searches knowledge base for books, activities, and strategies |

Both use **LangGraph's `create_react_agent`** with custom tools for memory/RAG access.

### Psychological Skills (`app/agents/skills/`)

**Modular framework plugins** that provide theoretical perspectives:

| Skill | File | Focus |
|-------|------|-------|
| **Developmental Psychology** | `developmental_psychology.py` | Piaget stages, Erikson's psychosocial development |
| **Behaviorist** | `behaviorist.py` | Operant conditioning, reinforcement, ABC model |

Each skill provides:
- `metadata` – Age ranges, keywords, best use cases
- `framework_overview` – Theoretical background
- `analysis_guidelines` – How to analyze behaviors through this lens
- `intervention_strategies` – Age-appropriate techniques

Skills are **loaded on-demand** based on relevance to prevent context window overflow.

---

## Memory System (Dual-Layer)

The system implements a **dual-layer memory architecture** for comprehensive context management:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MEMORY ARCHITECTURE                             │
├─────────────────────────────────┬───────────────────────────────────────┤
│       SHORT-TERM MEMORY         │         LONG-TERM MEMORY              │
│    (Conversation State)         │      (Persistent Knowledge)           │
├─────────────────────────────────┼───────────────────────────────────────┤
│  AsyncPostgresSaver             │  AsyncPostgresStore                   │
│  (LangGraph Checkpointer)       │  (LangGraph Store)                    │
├─────────────────────────────────┼───────────────────────────────────────┤
│  • Thread-scoped                │  • Child-scoped                       │
│  • Stores conversation history  │  • Survives server restarts           │
│  • Message accumulation         │  • Semantic search enabled            │
│  • Auto-managed by LangGraph    │  • GDPR-compliant deletion            │
└─────────────────────────────────┴───────────────────────────────────────┘
```

### Memory Backends (`app/memory/backends.py`)

```python
class MemoryBackends:
    def get_checkpointer(self):
        """Short-term: AsyncPostgresSaver for conversation state"""
        
    def get_store(self):
        """Long-term: AsyncPostgresStore with semantic embeddings"""
        
    def search_memories(self, child_id, query, memory_types, limit):
        """Semantic search across all memory types"""
        
    def delete_all_child_memories(self, child_id):
        """GDPR compliance: Full child data deletion"""
```

### Memory Schemas (`app/memory/schemas.py`)

| Schema | Purpose |
|--------|---------|
| `BehavioralPattern` | Observed behaviors with triggers, frequency, severity |
| `DevelopmentalMilestone` | Achieved milestones with categories (physical, cognitive, etc.) |
| `SuccessfulIntervention` | Strategies that worked, with effectiveness ratings |
| `TriggerResponse` | Trigger-response patterns with coping strategies |
| `TimelineEvent` | Significant life events (divorce, moving, death, etc.) |
| `ChildMemory` | Aggregated memory structure per child |

### Memory Manager (`app/memory/manager.py`)

High-level interface for memory operations:

```python
class MemoryManager:
    def add_behavioral_pattern(...)      # Record new patterns
    def update_behavioral_pattern(...)   # Update existing patterns
    def add_developmental_milestone(...) # Track milestones
    def add_successful_intervention(...) # Log what works
    def add_timeline_event(...)          # Track life events
    
    def search_similar_patterns(...)     # Semantic search for patterns
    def search_relevant_interventions(...)# Find applicable interventions
    def get_temporal_pattern_analysis(...)# Analyze trends over time
```

---

## RAG Knowledge Base

The system uses **ChromaDB** with **Azure OpenAI embeddings** for retrieval-augmented generation:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      KNOWLEDGE BASE (RAG)                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Storage: ChromaDB (Vector Store)                                       │
│  Embeddings: Azure OpenAI text-embedding-3-large                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📚 BOOKS COLLECTION                                                    │
│  ├─ title, author, description                                          │
│  ├─ age_range (min, max)                                                │
│  ├─ topics (list)                                                       │
│  └─ amazon_link (optional)                                              │
│                                                                         │
│  🎮 ACTIVITIES COLLECTION                                               │
│  ├─ name, description, instructions                                     │
│  ├─ age_range, duration_minutes                                         │
│  ├─ skills_developed, materials_needed                                  │
│  └─ category (motor, social, cognitive, etc.)                           │
│                                                                         │
│  📋 STRATEGIES COLLECTION                                               │
│  ├─ name, description, implementation_steps                             │
│  ├─ age_range, category                                                 │
│  ├─ issues_addressed (list)                                             │
│  └─ expected_outcomes                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Vector Store (`app/knowledge_base/vector_store.py`)

```python
class KnowledgeBaseVectorStore:
    def add_books(self, books: List[Dict])        # Bulk add books
    def add_activities(self, activities: List[Dict])
    def add_strategies(self, strategies: List[Dict])
    
    def search_books(self, query, child_age, k=5)
    def search_activities(self, query, child_age, duration_max=None, k=5)
    def search_strategies(self, query, child_age, category=None, k=5)
```

**Age Filtering**: All searches filter results by `child_age` to ensure age-appropriate recommendations.

---

## LangGraph Workflow

The core conversation flow is an **8-node LangGraph workflow**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW PIPELINE                                │
└─────────────────────────────────────────────────────────────────────────┘

    parse_input ──► route_to_agents ──► call_behavior_analyst
                                                │
                                                ▼
    format_output ◄── safety_check ◄── synthesize_response
          │                                     ▲
          │                                     │
          ▼                       apply_psychological_perspective
       [END]                                    ▲
                                                │
                               call_material_consultant ◄──┘
```

### Workflow State (`app/workflow/state.py`)

```python
class TherapistState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    child_id: int
    child_age: int
    parent_id: int
    current_concern: str
    parent_emotional_state: Optional[str]
    
    # Analysis results
    behavior_analysis: Optional[str]
    psychological_perspective: Optional[str]
    material_recommendations: Optional[str]
    
    # Safety
    requires_human_review: bool
    safety_flags: list[str]
    was_interrupted: bool
    human_decision: Optional[str]
```

### Workflow Nodes (`app/workflow/nodes.py`)

| Node | Purpose |
|------|---------|
| `parse_input` | Extract concern and emotional state from parent message |
| `route_to_agents` | Decide which subagents to invoke |
| `call_behavior_analyst` | Analyze patterns against child history |
| `apply_psychological_perspective` | Load and apply relevant psychological skills |
| `call_material_consultant` | Search knowledge base for recommendations |
| `synthesize_response` | Combine all insights into coherent response |
| `safety_check` | Flag sensitive content, trigger human-in-the-loop |
| `format_output` | Create final formatted message |

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| **LLM** | Azure OpenAI GPT-4 / gpt-5.2-chat |
| **Embeddings** | Azure OpenAI text-embedding-3-large |
| **Framework** | LangChain + LangGraph |
| **Web API** | FastAPI |
| **Database** | PostgreSQL 15+ |
| **Memory Store** | LangGraph AsyncPostgresStore |
| **Vector Store** | ChromaDB |
| **Cache** | Redis |
| **Task Queue** | Celery |
| **Auth** | Firebase Authentication + JWT |
| **Monitoring** | LangSmith, Prometheus, Sentry |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- Azure OpenAI API keys

### Installation

```bash
# 1. Clone and configure
cd Lundo
cp .env.example .env
# Edit .env with your API keys

# 2. Start with Docker
docker-compose up -d

# 3. Access
# API: http://localhost:8080
# Docs: http://localhost:8080/api/v1/docs
```

### Local Development

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements-dev.txt

# 3. Start infrastructure
docker-compose up postgres redis chroma -d

# 4. Run migrations
alembic upgrade head

# 5. Start server
uvicorn app.main:app --reload --port 8080
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register parent account |
| POST | `/api/v1/auth/login` | Login and get JWT |
| POST | `/api/v1/auth/refresh` | Refresh access token |

### Child Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/children` | Create child profile |
| GET | `/api/v1/children` | List your children |
| GET | `/api/v1/children/{id}` | Get child details |
| PUT | `/api/v1/children/{id}` | Update profile |
| DELETE | `/api/v1/children/{id}` | Delete profile |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/conversations` | Start conversation |
| POST | `/api/v1/conversations/{id}/messages` | Send message |
| GET | `/api/v1/conversations/{id}` | Get history |

### Memory & Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/children/{id}/memories` | View long-term memories |
| GET | `/api/v1/children/{id}/patterns` | Behavioral patterns |
| GET | `/api/v1/children/{id}/timeline` | Developmental timeline |

---

## Configuration

Key environment variables (`.env`):

```bash
# LLM (Azure OpenAI)
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-5.2-chat

# Embeddings
AZURE_OPENAI_EMBEDDING_API_KEY=your-key
AZURE_OPENAI_EMBEDDING_ENDPOINT=https://your-endpoint.openai.azure.com
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-large

# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/child_therapist
REDIS_URL=redis://localhost:6379/0

# Vector Store
CHROMA_HOST=localhost
CHROMA_PORT=8000

# Auth
JWT_SECRET_KEY=your-secret-key
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json

# Monitoring (optional)
LANGSMITH_API_KEY=your-key
LANGSMITH_TRACING=true
```

---

## Development

### Project Structure

```
Lundo/
├── app/
│   ├── agents/
│   │   ├── supervisor.py      # Main orchestrator
│   │   ├── subagents/         # Behavior Analyst, Material Consultant
│   │   └── skills/            # Psychological framework plugins
│   ├── api/                   # REST API endpoints
│   ├── database/              # SQLAlchemy + migrations
│   ├── memory/                # Dual-layer memory system
│   │   ├── backends.py        # PostgresStore + Checkpointer
│   │   ├── manager.py         # High-level memory operations
│   │   └── schemas.py         # Memory data models
│   ├── knowledge_base/        # RAG vector store
│   │   ├── vector_store.py    # ChromaDB integration
│   │   └── resources/         # Book/activity/strategy data
│   ├── workflow/              # LangGraph workflow
│   │   ├── graph.py           # Workflow definition
│   │   ├── nodes.py           # Node implementations
│   │   └── state.py           # State schema
│   ├── models/                # SQLAlchemy ORM models
│   ├── schemas/               # Pydantic request/response schemas
│   ├── services/              # Business logic layer
│   └── safety/                # Human-in-the-loop config
├── tests/                     # Test suites
├── frontend/                  # React frontend
├── docker/                    # Docker configuration
└── data/                      # Local data storage
```

### Running Tests

```bash
pytest tests/ -v
```

### Code Quality

```bash
black app/ tests/
ruff check app/ tests/
mypy app/
```

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## License

Proprietary - All rights reserved

---

> ⚠️ **Disclaimer**: This system provides general guidance only and is not a replacement for professional mental health services. Always consult qualified professionals for serious behavioral concerns.
