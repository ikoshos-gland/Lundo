"""Memory and insights API endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from app.dependencies import get_current_user
from app.models.user import User
from app.models.child import Child
from app.database.session import get_db
from app.memory.manager import MemoryManager
from app.memory.backends import MemoryBackends
from app.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

router = APIRouter()


# Response schemas
class MemorySummaryResponse(BaseModel):
    """Memory summary for a child."""
    child_id: int
    behavioral_patterns: dict
    developmental_history: dict
    successful_interventions: dict
    triggers_and_responses: dict
    timeline_events: dict


class PatternRecurrenceResponse(BaseModel):
    """Pattern recurrence analysis."""
    pattern_id: str
    behavior: str
    first_observed: str
    last_observed: str
    duration_days: int
    frequency: str
    severity: str
    similar_patterns_count: int
    triggers: List[str]
    context: str


class TemporalAnalysisResponse(BaseModel):
    """Temporal pattern analysis."""
    total_relevant_patterns: int
    recent_patterns: int
    days_analyzed: int
    frequency_distribution: dict
    recent_occurrences: List[dict]
    trend: str


class MemorySearchRequest(BaseModel):
    """Memory search request."""
    query: str = Field(..., min_length=1, description="Search query")
    memory_types: Optional[List[str]] = Field(None, description="Memory types to search")
    limit: int = Field(10, ge=1, le=50, description="Maximum results")


class MemorySearchResponse(BaseModel):
    """Memory search results."""
    results: List[dict]
    total_found: int


async def get_memory_manager() -> MemoryManager:
    """Get memory manager instance."""
    backends = MemoryBackends(
        database_url=settings.database_url,
        use_semantic_search=True
    )
    return MemoryManager(backends)


async def verify_child_ownership(
    child_id: int,
    user_id: int,
    db: AsyncSession
) -> Child:
    """
    Verify that a child belongs to the current user.

    Args:
        child_id: Child's ID
        user_id: User's ID
        db: Database session

    Returns:
        Child object

    Raises:
        HTTPException: If child not found or not owned by user
    """
    result = await db.execute(
        select(Child).where(Child.id == child_id)
    )
    child = result.scalar_one_or_none()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )

    if child.parent_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this child's memories"
        )

    return child


@router.get("/{child_id}/summary", response_model=MemorySummaryResponse)
async def get_memory_summary(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive memory summary for a child.

    Returns counts and recent items for all memory types.

    Args:
        child_id: Child's ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        Memory summary with statistics
    """
    await verify_child_ownership(child_id, current_user.id, db)

    memory_manager = await get_memory_manager()
    summary = await memory_manager.get_child_memory_summary(child_id)

    return MemorySummaryResponse(
        child_id=child_id,
        **summary
    )


@router.post("/{child_id}/search", response_model=MemorySearchResponse)
async def search_memories(
    child_id: int,
    search_request: MemorySearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Search across child's memories using semantic search.

    Args:
        child_id: Child's ID
        search_request: Search parameters
        current_user: Current authenticated user
        db: Database session

    Returns:
        Search results with relevance scores
    """
    await verify_child_ownership(child_id, current_user.id, db)

    memory_manager = await get_memory_manager()
    results = await memory_manager.backends.search_memories(
        child_id=child_id,
        query=search_request.query,
        memory_types=search_request.memory_types,
        limit=search_request.limit
    )

    return MemorySearchResponse(
        results=results,
        total_found=len(results)
    )


@router.get("/{child_id}/patterns", response_model=List[dict])
async def get_behavioral_patterns(
    child_id: int,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all behavioral patterns for a child.

    Args:
        child_id: Child's ID
        limit: Maximum patterns to return
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of behavioral patterns
    """
    await verify_child_ownership(child_id, current_user.id, db)

    memory_manager = await get_memory_manager()
    patterns = await memory_manager.backends.list_memories(
        child_id, "behavioral_patterns", limit=limit
    )

    return patterns


@router.get("/{child_id}/patterns/{pattern_id}/recurrence", response_model=PatternRecurrenceResponse)
async def analyze_pattern_recurrence(
    child_id: int,
    pattern_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze recurrence of a specific behavioral pattern.

    Args:
        child_id: Child's ID
        pattern_id: Pattern ID to analyze
        current_user: Current authenticated user
        db: Database session

    Returns:
        Recurrence analysis
    """
    await verify_child_ownership(child_id, current_user.id, db)

    memory_manager = await get_memory_manager()
    analysis = await memory_manager.find_pattern_recurrence(child_id, pattern_id)

    if "error" in analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=analysis["error"]
        )

    return PatternRecurrenceResponse(**analysis)


@router.get("/{child_id}/temporal-analysis", response_model=TemporalAnalysisResponse)
async def get_temporal_analysis(
    child_id: int,
    behavior_query: str = Query(..., min_length=1),
    days_back: int = Query(90, ge=7, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze temporal patterns in behaviors.

    Args:
        child_id: Child's ID
        behavior_query: Query to find related behaviors
        days_back: How many days to look back
        current_user: Current authenticated user
        db: Database session

    Returns:
        Temporal analysis including frequency trends
    """
    await verify_child_ownership(child_id, current_user.id, db)

    memory_manager = await get_memory_manager()
    analysis = await memory_manager.get_temporal_pattern_analysis(
        child_id, behavior_query, days_back
    )

    return TemporalAnalysisResponse(**analysis)


@router.get("/{child_id}/timeline", response_model=List[dict])
async def get_timeline_events(
    child_id: int,
    limit: int = Query(50, ge=1, le=200),
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get developmental timeline events for a child.

    Args:
        child_id: Child's ID
        limit: Maximum events to return
        category: Optional category filter
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of timeline events
    """
    await verify_child_ownership(child_id, current_user.id, db)

    memory_manager = await get_memory_manager()
    events = await memory_manager.backends.list_memories(
        child_id, "timeline_events", limit=limit
    )

    # Filter by category if specified
    if category:
        events = [e for e in events if e.get("category") == category]

    # Sort by date descending
    events.sort(key=lambda x: x.get("date", ""), reverse=True)

    return events


@router.get("/{child_id}/interventions", response_model=List[dict])
async def get_successful_interventions(
    child_id: int,
    limit: int = Query(50, ge=1, le=200),
    issue: Optional[str] = Query(None, description="Search for specific issue"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get successful interventions for a child.

    Args:
        child_id: Child's ID
        limit: Maximum interventions to return
        issue: Optional search query for specific issue
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of successful interventions
    """
    await verify_child_ownership(child_id, current_user.id, db)

    memory_manager = await get_memory_manager()

    if issue:
        # Search for relevant interventions
        interventions = await memory_manager.search_relevant_interventions(
            child_id, issue, limit=limit
        )
        return [i["data"] for i in interventions]
    else:
        # Get all interventions
        interventions = await memory_manager.backends.list_memories(
            child_id, "successful_interventions", limit=limit
        )
        return interventions


@router.get("/{child_id}/triggers", response_model=List[dict])
async def get_trigger_responses(
    child_id: int,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get trigger-response patterns for a child.

    Args:
        child_id: Child's ID
        limit: Maximum patterns to return
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of trigger-response patterns
    """
    await verify_child_ownership(child_id, current_user.id, db)

    memory_manager = await get_memory_manager()
    triggers = await memory_manager.backends.list_memories(
        child_id, "triggers_and_responses", limit=limit
    )

    return triggers


@router.delete("/{child_id}/all", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_memories(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete all memories for a child (GDPR compliance).

    Args:
        child_id: Child's ID
        current_user: Current authenticated user
        db: Database session
    """
    await verify_child_ownership(child_id, current_user.id, db)

    memory_manager = await get_memory_manager()
    await memory_manager.delete_all_memories(child_id)

    return None
