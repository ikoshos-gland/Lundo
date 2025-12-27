# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Child Behavioral Therapist is a production-ready multi-agent system for providing empathetic, expert-informed behavioral guidance to parents. Built with LangChain, LangGraph, and FastAPI.

**Core Technology**: Google Gemini 1.5 Pro via LangChain + LangGraph, FastAPI, PostgreSQL, Redis, Chroma vector store

## Development Commands

### Local Development Setup

```bash
# Install dependencies
pip install -r requirements-dev.txt

# Start infrastructure (PostgreSQL, Redis, Chroma)
docker-compose up postgres redis chroma -d

# Run database migrations
alembic upgrade head

# Start API server (development mode with reload)
uvicorn app.main:app --reload --port 8080
```

### Full Docker Environment

```bash
# Start all services
docker-compose up -d

# Access API at http://localhost:8080
# API docs at http://localhost:8080/api/v1/docs
# Flower (Celery monitoring) at http://localhost:5555
```

### Testing & Code Quality

```bash
# Run all tests with coverage
pytest tests/ -v

# Run specific test file
pytest tests/test_agents/ -v

# Run single test
pytest tests/test_workflow/test_graph.py::test_workflow_execution -v

# Code formatting and linting
black app/ tests/
ruff check app/ tests/
mypy app/
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

### Utility Scripts

```bash
# Initialize database with tables
python scripts/init_database.py

# Seed knowledge base resources (books, activities, strategies)
python scripts/seed_resources.py

# Test system end-to-end
python scripts/test_system.py
```

## Architecture

### Multi-Agent Workflow System

The system uses a **supervisor pattern** with LangGraph for state management and orchestration. The workflow is sequential with state passed between nodes:

```
parse_input → route_to_agents → call_behavior_analyst →
apply_psychological_perspective → call_material_consultant →
safety_check → synthesize_response → format_output
```

**Key Architecture Points**:

1. **Workflow State** (`app/workflow/state.py` - `TherapistState`): TypedDict that flows through all nodes containing messages, child/parent IDs, analysis results, routing decisions, safety flags, and session metadata.

2. **LangGraph Checkpointing**: Uses `AsyncPostgresSaver` for conversation state persistence. The `thread_id` parameter enables conversation continuity across sessions.

3. **Supervisor Agent** (`app/agents/supervisor.py`): High-level orchestrator that wraps workflow execution, manages memory updates, and provides API interface. Single global instance at module level.

4. **Workflow Nodes** (`app/workflow/nodes.py`): Each node is an async function that receives `TherapistState` and returns updated state dict. Nodes are pure functions - no side effects except LLM calls.

### Subagents

Located in `app/agents/subagents/`:

- **Behavior Analyst** (`behavior_analyst.py`): LangChain tool-calling agent with tools to read child's memory and search for similar patterns. Uses `MemoryBackends` to access long-term storage.

- **Material Consultant** (`material_consultant.py`): Recommends age-appropriate resources by searching Chroma vector store containing books, activities, and strategies.

Both subagents are **called from workflow nodes**, not directly from API.

### Skills System

Located in `app/agents/skills/`:

Psychological frameworks that can be dynamically loaded based on relevance:
- `developmental_psychology.py` - Piaget, Erikson, Vygotsky frameworks
- `behaviorist.py` - Operant conditioning, reinforcement strategies

Each skill has `is_applicable(child_age, keywords)` method returning (bool, score). Skills are selected in `route_to_agents` node and applied in `apply_psychological_perspective` node.

### Dual-Layer Memory Architecture

**Short-term (Conversation State)**:
- Managed by LangGraph's AsyncPostgresSaver checkpointer
- Keyed by `thread_id` for conversation continuity
- Stores: messages, current concern, parent emotional state, agent outputs

**Long-term (Child History)**:
- Managed by `MemoryBackends` (`app/memory/backends.py`)
- Stored in Redis (development) or PostgreSQL (production)
- Also uses Chroma vector store for semantic search
- Types: behavioral_patterns, developmental_history, successful_interventions, triggers_and_responses, timeline_events

**Memory Manager** (`app/memory/manager.py`): High-level API for adding patterns, searching similar behaviors, temporal analysis. Use this instead of direct backend access.

**IMPORTANT**: Memory updates happen in `SupervisorAgent._update_memory_from_conversation()` AFTER workflow completes, not during workflow execution.

### Safety & Human-in-the-Loop

Configuration in `app/safety/`:
- `content_filter.py` - Content moderation
- `triggers.py` - Sensitive topic detection (abuse, self-harm, etc.)
- `safety_check` node sets `requires_human_review` flag in state

To enable human review interrupts, uncomment in `app/workflow/graph.py:81`:
```python
interrupt_before=["synthesize_response"]
```

## API Structure

All endpoints in `app/api/v1/`:
- `auth.py` - Authentication (Firebase + JWT fallback)
- `children.py` - CRUD for child profiles
- `conversations.py` - Main interaction endpoint (`POST /api/v1/conversations/{id}/messages`)
- `memories.py` - View long-term memories, patterns, timeline
- `interrupts.py` - Handle human-in-the-loop approvals

**Authentication**: Supports both Firebase Auth and JWT tokens. Use `get_current_user` dependency.

### Firebase Authentication

The system uses Firebase Auth for user authentication with automatic user provisioning:

1. **Frontend**: User signs in via Firebase SDK (email/password, Google, etc.)
2. **Backend**: Frontend sends Firebase ID token to `POST /api/v1/auth/firebase`
3. **User Creation**: Backend verifies token and creates/updates user in database
4. **Subsequent Requests**: Use Firebase ID token as Bearer token

**Setup Firebase**:
1. Create Firebase project at https://console.firebase.google.com
2. Enable Authentication and configure sign-in methods
3. Go to Project Settings > Service Accounts > Generate New Private Key
4. Save as `firebase-credentials.json` in project root
5. Set `FIREBASE_CREDENTIALS_PATH` in `.env`

**Auth Endpoints**:
- `POST /api/v1/auth/firebase` - Authenticate with Firebase ID token (creates user if needed)
- `POST /api/v1/auth/register` - Legacy email/password registration
- `POST /api/v1/auth/login` - Legacy email/password login
- `GET /api/v1/auth/me` - Get current user info

## Configuration

All settings in `app/config.py` using Pydantic BaseSettings. Configuration loaded from `.env` file (see `.env.example`).

**Critical Settings**:
- `GOOGLE_API_KEY` - Required for LLM functionality
- `DATABASE_URL` - PostgreSQL connection (must use `postgresql+asyncpg://` for async)
- `REDIS_URL` - Redis for caching and celery
- `LANGSMITH_API_KEY` + `LANGSMITH_TRACING=true` - Enable LangSmith observability
- `FIREBASE_CREDENTIALS_PATH` - Path to Firebase service account JSON file

**Settings Access**: Import global singleton:
```python
from app.config import settings
```

## Database Models

SQLAlchemy async models in `app/models/`:
- `user.py` - Parent accounts
- `child.py` - Child profiles with age, preferences, behavioral notes
- `conversation.py` - Conversation threads
- `message.py` - Individual messages with role (user/assistant)

**Database Access**: Use async session from `app/database/session.py`:
```python
from app.dependencies import get_db

async def endpoint(db: AsyncSession = Depends(get_db)):
    # Use db here
```

## Knowledge Base

`app/knowledge_base/`:
- `resources/` - JSON files with books, activities, strategies
- `vector_store.py` - Chroma vector store wrapper for semantic search

Resources are embedded and indexed by age range and category. Material Consultant searches this store.

## Important Implementation Notes

1. **Always use async/await**: All database, LLM, and memory operations are async.

2. **LangGraph State Updates**: Return dict with `**state` spread to preserve existing fields:
   ```python
   return {**state, "new_field": value}
   ```

3. **Message Handling**: Use LangChain message types (`HumanMessage`, `AIMessage`) in workflow. The `add_messages` reducer in state automatically appends to message list.

4. **Error Handling**: Workflow nodes should handle errors gracefully and set appropriate flags rather than raising exceptions that break the flow.

5. **Testing with Async**: Use `pytest-asyncio` with `asyncio_mode = "auto"` (configured in pyproject.toml).

6. **Code Style**: Black with line length 100, Ruff for linting. Configuration in pyproject.toml.

7. **Celery Background Tasks**: Celery worker runs in separate container. Configure tasks in `app/services/celery_app.py` (not yet implemented in current codebase).

## Deployment Notes

- Production uses Kubernetes (see reference in README to plan file)
- Container image built from `docker/Dockerfile`
- Requires external PostgreSQL 15+, Redis 7+, and Chroma instance
- Environment variables must include production secrets (JWT_SECRET_KEY, etc.)
- GDPR compliance: All child data deletable via `MemoryManager.delete_all_memories()`

## Troubleshooting

### Docker "Cannot Stop Container: Permission Denied" (Ubuntu/AppArmor)

**Symptom**: `docker stop` or `docker kill` returns "permission denied" even with sudo.

**Cause**: AppArmor security policies blocking Docker operations. Common on Ubuntu 22.04+.

**Quick Fix**:
```bash
sudo aa-remove-unknown
sudo systemctl restart docker
```

**Permanent Fixes**:
```bash
# Option A: Disable AppArmor entirely (dev machines)
sudo systemctl disable apparmor
sudo systemctl stop apparmor

# Option B: Remove AppArmor completely
sudo apt-get purge --auto-remove apparmor

# Option C: Set Docker to complain mode only (keeps AppArmor for other apps)
sudo aa-complain /etc/apparmor.d/docker*
```

If issue recurs after system updates, re-run the quick fix.
