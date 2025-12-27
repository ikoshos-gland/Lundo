#!/bin/bash
set -e

# Wait for database to be ready
wait_for_db() {
    echo "Waiting for PostgreSQL..."
    while ! python -c "
import asyncio
import asyncpg
async def check():
    try:
        conn = await asyncpg.connect('${DATABASE_URL}'.replace('+asyncpg', ''))
        await conn.close()
        return True
    except:
        return False
exit(0 if asyncio.run(check()) else 1)
" 2>/dev/null; do
        echo "PostgreSQL not ready, waiting..."
        sleep 2
    done
    echo "PostgreSQL is ready!"
}

# Wait for Redis to be ready
wait_for_redis() {
    echo "Waiting for Redis..."
    while ! python -c "
import redis
r = redis.from_url('${REDIS_URL}')
r.ping()
" 2>/dev/null; do
        echo "Redis not ready, waiting..."
        sleep 2
    done
    echo "Redis is ready!"
}

# Run database migrations
run_migrations() {
    echo "Running database migrations..."
    alembic upgrade head
    echo "Migrations complete!"
}

# Seed initial data if needed
seed_data() {
    if [ "$SEED_DATA" = "true" ]; then
        echo "Seeding knowledge base resources..."
        python scripts/seed_resources.py
        echo "Seeding complete!"
    fi
}

case "$1" in
    api)
        wait_for_db
        wait_for_redis
        run_migrations
        seed_data
        echo "Starting API server..."
        exec uvicorn app.main:app --host 0.0.0.0 --port 8080 --workers ${WORKERS:-1}
        ;;
    worker)
        wait_for_db
        wait_for_redis
        echo "Starting Celery worker..."
        exec celery -A app.services.celery_app worker --loglevel=${LOG_LEVEL:-info}
        ;;
    beat)
        wait_for_db
        wait_for_redis
        echo "Starting Celery beat..."
        exec celery -A app.services.celery_app beat --loglevel=${LOG_LEVEL:-info}
        ;;
    migrate)
        wait_for_db
        run_migrations
        ;;
    seed)
        wait_for_db
        python scripts/seed_resources.py
        ;;
    shell)
        exec /bin/bash
        ;;
    *)
        exec "$@"
        ;;
esac
