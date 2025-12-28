"""Memory management utilities and tools for child behavioral therapist system."""
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict

from app.memory.backends import MemoryBackends
from app.memory.schemas import (
    ChildMemory,
    BehavioralPattern,
    DevelopmentalMilestone,
    SuccessfulIntervention,
    TriggerResponse,
    TimelineEvent
)


class MemoryManager:
    """
    High-level memory management for child behavioral analysis.

    Provides tools for:
    - Writing and updating structured memories
    - Semantic search across memory types
    - Temporal tracking and pattern analysis
    - Memory insights and analytics
    """

    def __init__(self, backends: MemoryBackends):
        """
        Initialize memory manager.

        Args:
            backends: MemoryBackends instance
        """
        self.backends = backends

    async def add_behavioral_pattern(
        self,
        child_id: int,
        behavior: str,
        context: str,
        frequency: str,
        triggers: List[str],
        severity: str = "mild",
        notes: Optional[str] = None
    ) -> str:
        """
        Add a new behavioral pattern observation.

        Args:
            child_id: Child's ID
            behavior: Description of the behavior
            context: Context in which behavior occurs
            frequency: How often it occurs
            triggers: Known triggers
            severity: Severity level (mild, moderate, severe)
            notes: Additional notes

        Returns:
            Pattern ID (key)
        """
        pattern_id = str(uuid.uuid4())
        now = datetime.now()

        pattern = BehavioralPattern(
            behavior=behavior,
            context=context,
            frequency=frequency,
            triggers=triggers,
            severity=severity,
            first_observed=now,
            last_observed=now,
            notes=notes
        )

        await self.backends.save_long_term_memory(
            child_id=child_id,
            memory_type="behavioral_patterns",
            key=pattern_id,
            data=pattern.model_dump(mode='json')
        )

        return pattern_id

    async def update_behavioral_pattern(
        self,
        child_id: int,
        pattern_id: str,
        last_observed: Optional[datetime] = None,
        frequency: Optional[str] = None,
        severity: Optional[str] = None,
        new_triggers: Optional[List[str]] = None,
        notes: Optional[str] = None
    ) -> bool:
        """
        Update an existing behavioral pattern.

        Args:
            child_id: Child's ID
            pattern_id: Pattern ID to update
            last_observed: New last observed time
            frequency: Updated frequency
            severity: Updated severity
            new_triggers: Additional triggers to add
            notes: Updated notes

        Returns:
            True if updated successfully
        """
        existing = await self.backends.get_long_term_memory(
            child_id, "behavioral_patterns", pattern_id
        )

        if not existing:
            return False

        # Update fields
        if last_observed:
            existing["last_observed"] = last_observed.isoformat()
        if frequency:
            existing["frequency"] = frequency
        if severity:
            existing["severity"] = severity
        if new_triggers:
            existing["triggers"] = list(set(existing.get("triggers", []) + new_triggers))
        if notes:
            existing["notes"] = notes

        await self.backends.save_long_term_memory(
            child_id, "behavioral_patterns", pattern_id, existing
        )

        return True

    async def add_developmental_milestone(
        self,
        child_id: int,
        milestone: str,
        category: str,
        age_months: int,
        achieved_at: Optional[datetime] = None,
        notes: Optional[str] = None
    ) -> str:
        """
        Record a developmental milestone.

        Args:
            child_id: Child's ID
            milestone: Name of the milestone
            category: Category (physical, cognitive, social, emotional)
            age_months: Age in months when achieved
            achieved_at: When achieved (defaults to now)
            notes: Additional notes

        Returns:
            Milestone ID
        """
        milestone_id = str(uuid.uuid4())

        milestone_obj = DevelopmentalMilestone(
            milestone=milestone,
            category=category,
            age_months=age_months,
            achieved_at=achieved_at or datetime.now(),
            notes=notes
        )

        await self.backends.save_long_term_memory(
            child_id, "developmental_history", milestone_id,
            milestone_obj.model_dump(mode='json')
        )

        return milestone_id

    async def add_successful_intervention(
        self,
        child_id: int,
        strategy: str,
        issue_addressed: str,
        effectiveness: str,
        outcome: str,
        applicable_contexts: List[str],
        applied_date: Optional[datetime] = None
    ) -> str:
        """
        Record a successful intervention strategy.

        Args:
            child_id: Child's ID
            strategy: Description of the strategy
            issue_addressed: What issue it helped with
            effectiveness: Effectiveness level (low, medium, high)
            outcome: Description of the outcome
            applicable_contexts: Contexts where this worked
            applied_date: When applied (defaults to now)

        Returns:
            Intervention ID
        """
        intervention_id = str(uuid.uuid4())

        intervention = SuccessfulIntervention(
            strategy=strategy,
            issue_addressed=issue_addressed,
            effectiveness=effectiveness,
            outcome=outcome,
            applicable_contexts=applicable_contexts,
            applied_date=applied_date or datetime.now()
        )

        await self.backends.save_long_term_memory(
            child_id, "successful_interventions", intervention_id,
            intervention.model_dump(mode='json')
        )

        return intervention_id

    async def add_trigger_response(
        self,
        child_id: int,
        trigger: str,
        typical_response: str,
        severity: str,
        successful_coping: List[str],
        observed_date: Optional[datetime] = None
    ) -> str:
        """
        Record a trigger-response pattern.

        Args:
            child_id: Child's ID
            trigger: The triggering event/situation
            typical_response: Child's typical response
            severity: Severity level (mild, moderate, severe)
            successful_coping: Coping strategies that worked
            observed_date: When observed (defaults to now)

        Returns:
            Trigger-response ID
        """
        tr_id = str(uuid.uuid4())

        trigger_response = TriggerResponse(
            trigger=trigger,
            typical_response=typical_response,
            severity=severity,
            successful_coping=successful_coping,
            observed_dates=[observed_date or datetime.now()]
        )

        await self.backends.save_long_term_memory(
            child_id, "triggers_and_responses", tr_id,
            trigger_response.model_dump(mode='json')
        )

        return tr_id

    async def add_timeline_event(
        self,
        child_id: int,
        event: str,
        category: str,
        impact: str,
        behavioral_changes: List[str],
        date: Optional[datetime] = None
    ) -> str:
        """
        Record a significant timeline event.

        Args:
            child_id: Child's ID
            event: Description of the event
            category: Category (life_change, achievement, challenge, medical, other)
            impact: How it impacted the child
            behavioral_changes: Any behavioral changes noted
            date: When it occurred (defaults to now)

        Returns:
            Event ID
        """
        event_id = str(uuid.uuid4())

        timeline_event = TimelineEvent(
            event=event,
            date=date or datetime.now(),
            category=category,
            impact=impact,
            behavioral_changes=behavioral_changes
        )

        await self.backends.save_long_term_memory(
            child_id, "timeline_events", event_id,
            timeline_event.model_dump(mode='json')
        )

        return event_id

    async def search_similar_patterns(
        self,
        child_id: int,
        current_concern: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for similar behavioral patterns using semantic search.

        Args:
            child_id: Child's ID
            current_concern: Description of current concern
            limit: Maximum results to return

        Returns:
            List of similar patterns with relevance scores
        """
        return await self.backends.search_memories(
            child_id=child_id,
            query=current_concern,
            memory_types=["behavioral_patterns", "triggers_and_responses"],
            limit=limit
        )

    async def search_relevant_interventions(
        self,
        child_id: int,
        issue: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find relevant successful interventions for an issue.

        Args:
            child_id: Child's ID
            issue: Description of the issue
            limit: Maximum results to return

        Returns:
            List of relevant interventions
        """
        return await self.backends.search_memories(
            child_id=child_id,
            query=issue,
            memory_types=["successful_interventions"],
            limit=limit
        )

    async def get_temporal_pattern_analysis(
        self,
        child_id: int,
        behavior_query: str,
        days_back: int = 90
    ) -> Dict[str, Any]:
        """
        Analyze temporal patterns in behaviors.

        Args:
            child_id: Child's ID
            behavior_query: Query to find related behaviors
            days_back: How many days to look back

        Returns:
            Temporal analysis including frequency trends
        """
        # Search for relevant patterns
        patterns = await self.backends.search_memories(
            child_id=child_id,
            query=behavior_query,
            memory_types=["behavioral_patterns"],
            limit=50
        )

        cutoff_date = datetime.now() - timedelta(days=days_back)

        # Analyze temporal trends
        recent_patterns = []
        frequency_counts = defaultdict(int)

        for pattern_data in patterns:
            pattern = pattern_data["data"]
            last_observed = datetime.fromisoformat(pattern.get("last_observed", ""))

            if last_observed >= cutoff_date:
                recent_patterns.append(pattern_data)
                frequency = pattern.get("frequency", "unknown")
                frequency_counts[frequency] += 1

        # Calculate trend
        time_sorted = sorted(
            recent_patterns,
            key=lambda x: x["data"].get("last_observed", ""),
            reverse=True
        )

        return {
            "total_relevant_patterns": len(patterns),
            "recent_patterns": len(recent_patterns),
            "days_analyzed": days_back,
            "frequency_distribution": dict(frequency_counts),
            "recent_occurrences": time_sorted[:10],
            "trend": self._calculate_trend(time_sorted, days_back)
        }

    def _calculate_trend(
        self,
        time_sorted_patterns: List[Dict],
        days_back: int
    ) -> str:
        """
        Calculate trend direction from temporal data.

        Args:
            time_sorted_patterns: Patterns sorted by time
            days_back: Analysis period

        Returns:
            Trend description
        """
        if len(time_sorted_patterns) < 2:
            return "insufficient_data"

        mid_point = days_back // 2
        cutoff = datetime.now() - timedelta(days=mid_point)

        recent_half = sum(
            1 for p in time_sorted_patterns
            if datetime.fromisoformat(p["data"].get("last_observed", "")) >= cutoff
        )
        older_half = len(time_sorted_patterns) - recent_half

        if recent_half > older_half * 1.5:
            return "increasing"
        elif older_half > recent_half * 1.5:
            return "decreasing"
        else:
            return "stable"

    async def get_child_memory_summary(
        self,
        child_id: int
    ) -> Dict[str, Any]:
        """
        Get a comprehensive summary of all memories for a child.

        Args:
            child_id: Child's ID

        Returns:
            Summary statistics and recent items
        """
        summary = {}

        memory_types = [
            "behavioral_patterns",
            "developmental_history",
            "successful_interventions",
            "triggers_and_responses",
            "timeline_events"
        ]

        for memory_type in memory_types:
            items = await self.backends.list_memories(child_id, memory_type, limit=100)
            summary[memory_type] = {
                "count": len(items),
                "recent": items[:5] if items else []
            }

        return summary

    async def find_pattern_recurrence(
        self,
        child_id: int,
        pattern_id: str
    ) -> Dict[str, Any]:
        """
        Analyze recurrence of a specific pattern.

        Args:
            child_id: Child's ID
            pattern_id: Pattern to analyze

        Returns:
            Recurrence analysis
        """
        pattern = await self.backends.get_long_term_memory(
            child_id, "behavioral_patterns", pattern_id
        )

        if not pattern:
            return {"error": "Pattern not found"}

        # Search for similar patterns
        similar = await self.search_similar_patterns(
            child_id,
            pattern.get("behavior", ""),
            limit=20
        )

        # Calculate recurrence metrics
        first_obs = datetime.fromisoformat(pattern.get("first_observed", ""))
        last_obs = datetime.fromisoformat(pattern.get("last_observed", ""))
        duration_days = (last_obs - first_obs).days

        return {
            "pattern_id": pattern_id,
            "behavior": pattern.get("behavior"),
            "first_observed": first_obs.isoformat(),
            "last_observed": last_obs.isoformat(),
            "duration_days": duration_days,
            "frequency": pattern.get("frequency"),
            "severity": pattern.get("severity"),
            "similar_patterns_count": len(similar),
            "triggers": pattern.get("triggers", []),
            "context": pattern.get("context")
        }

    async def delete_all_memories(self, child_id: int) -> None:
        """
        Delete all memories for a child (GDPR compliance).

        Args:
            child_id: Child's ID
        """
        await self.backends.delete_all_child_memories(child_id)
