# Child Behavioral Therapist

A production-ready multi-agent child behavioral therapist system built with LangChain, LangGraph, and FastAPI.

## Overview

This system uses a supervisor agent architecture to provide empathetic, expert-informed behavioral guidance for parents. It features:

- **Supervisor Agent** - Orchestrates specialized subagents and synthesizes responses
- **Behavior Analyst** - Analyzes patterns and compares with child's history
- **Psychological Perspective Engine** - Applies different theoretical frameworks (Developmental, Behaviorist, Play Therapy, etc.)
- **Material Consultant** - Recommends age-appropriate books, activities, and strategies
- **Dual-layer Memory** - Short-term conversation state + long-term persistent child history
- **Human-in-the-Loop** - Safety checks for sensitive topics

## Architecture

```
Parent Input → Supervisor Agent → Route to Subagents
                     ↓
         ┌───────────┼───────────┐
         ↓           ↓           ↓
    Behavior    Perspective   Material
    Analysis      Engine      Consultant
         ↓           ↓           ↓
         └───────────┼───────────┘
                     ↓
              Synthesize Results
                     ↓
           Human-in-the-Loop Check
                     ↓
              Response to Parent
```

## Technology Stack

- **LLM**: Google Gemini 1.5 Pro
- **Framework**: LangChain + LangGraph + DeepAgents
- **Web API**: FastAPI
- **Database**: PostgreSQL 15+
- **Cache**: Redis
- **Vector Store**: Chroma
- **Monitoring**: LangSmith, Prometheus, Sentry

## Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   cd child-behavioral-therapist
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

3. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - API: http://localhost:8080
   - API Docs: http://localhost:8080/api/v1/docs
   - Flower (Celery monitoring): http://localhost:5555

### Local Development (without Docker)

1. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements-dev.txt
   ```

3. **Start PostgreSQL and Redis**
   ```bash
   # Using Docker
   docker-compose up postgres redis chroma -d
   ```

4. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

5. **Start the API server**
   ```bash
   uvicorn app.main:app --reload --port 8080
   ```

## Project Structure

```
child-behavioral-therapist/
├── app/
│   ├── agents/              # LangChain agents
│   │   ├── supervisor.py    # Main orchestrator
│   │   ├── subagents/       # Specialized agents
│   │   └── skills/          # Psychological frameworks
│   ├── api/                 # REST API endpoints
│   ├── database/            # Database configuration
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   ├── workflow/            # LangGraph workflows
│   ├── memory/              # Memory management
│   ├── knowledge_base/      # Vector store & resources
│   └── safety/              # Human-in-the-loop config
├── tests/                   # Test suites
├── scripts/                 # Utility scripts
├── docker/                  # Docker configuration
└── data/                    # Local data storage
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new parent account
- `POST /api/v1/auth/login` - Login and get JWT token
- `POST /api/v1/auth/refresh` - Refresh access token

### Child Profiles
- `POST /api/v1/children` - Create child profile
- `GET /api/v1/children` - List your children
- `GET /api/v1/children/{child_id}` - Get child details
- `PUT /api/v1/children/{child_id}` - Update child profile
- `DELETE /api/v1/children/{child_id}` - Delete child profile

### Conversations
- `POST /api/v1/conversations` - Start new conversation
- `POST /api/v1/conversations/{id}/messages` - Send message (main interaction)
- `GET /api/v1/conversations/{id}` - Get conversation history
- `GET /api/v1/conversations` - List conversations

### Memory & Insights
- `GET /api/v1/children/{child_id}/memories` - View long-term memories
- `GET /api/v1/children/{child_id}/patterns` - Behavioral patterns
- `GET /api/v1/children/{child_id}/timeline` - Developmental timeline

## Configuration

All configuration is managed through environment variables. See `.env.example` for available options.

Key settings:
- `GOOGLE_API_KEY` - Your Google Gemini API key (required)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `LANGSMITH_API_KEY` - LangSmith tracing (optional)
- `JWT_SECRET_KEY` - Secret for JWT token signing

## Development

### Running Tests

```bash
pytest tests/ -v
```

### Code Formatting

```bash
black app/ tests/
ruff check app/ tests/
mypy app/
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Deployment

See the deployment guide in the [plan file](/.claude/plans/cozy-skipping-dusk.md) for production deployment instructions including:
- Kubernetes configuration
- Environment setup
- Monitoring and logging
- Security best practices

## Contributing

This is a production system for child behavioral therapy. Contributions should:
1. Follow the existing architecture
2. Include comprehensive tests
3. Maintain GDPR compliance
4. Not compromise child data privacy

## License

Proprietary - All rights reserved

## Support

For issues or questions, please contact the development team.

---

**⚠️ Important**: This system provides general guidance only and is not a replacement for professional mental health services. Always consult qualified professionals for serious behavioral concerns.
