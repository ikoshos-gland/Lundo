"""Memory schemas for long-term storage."""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class BehavioralPattern(BaseModel):
    """Schema for a behavioral pattern observation."""

    behavior: str = Field(description="Description of the behavior")
    context: str = Field(description="Context in which behavior occurs")
    frequency: str = Field(description="How often it occurs (e.g., 'daily', 'weekly')")
    triggers: List[str] = Field(default_factory=list, description="Known triggers")
    first_observed: datetime = Field(description="When first observed")
    last_observed: datetime = Field(description="Most recent occurrence")
    severity: str = Field(description="mild, moderate, severe")
    notes: Optional[str] = Field(None, description="Additional notes")


class DevelopmentalMilestone(BaseModel):
    """Schema for developmental milestone."""

    milestone: str = Field(description="Name of the milestone")
    category: str = Field(description="physical, cognitive, social, emotional")
    achieved_at: Optional[datetime] = Field(None, description="When achieved")
    age_months: int = Field(description="Age in months when achieved")
    notes: Optional[str] = Field(None, description="Additional notes")


class SuccessfulIntervention(BaseModel):
    """Schema for successful intervention strategy."""

    strategy: str = Field(description="Description of the strategy")
    issue_addressed: str = Field(description="What issue it helped with")
    effectiveness: str = Field(description="low, medium, high")
    applied_date: datetime = Field(description="When applied")
    outcome: str = Field(description="Description of the outcome")
    applicable_contexts: List[str] = Field(
        default_factory=list,
        description="Contexts where this worked"
    )


class TriggerResponse(BaseModel):
    """Schema for trigger-response pattern."""

    trigger: str = Field(description="The triggering event/situation")
    typical_response: str = Field(description="Child's typical response")
    severity: str = Field(description="mild, moderate, severe")
    successful_coping: List[str] = Field(
        default_factory=list,
        description="Coping strategies that worked"
    )
    observed_dates: List[datetime] = Field(
        default_factory=list,
        description="Dates when observed"
    )


class TimelineEvent(BaseModel):
    """Schema for significant timeline event."""

    event: str = Field(description="Description of the event")
    date: datetime = Field(description="When it occurred")
    category: str = Field(
        description="life_change, achievement, challenge, medical, other"
    )
    impact: str = Field(description="How it impacted the child")
    behavioral_changes: List[str] = Field(
        default_factory=list,
        description="Any behavioral changes noted after this event"
    )


class ChildMemory(BaseModel):
    """Complete memory structure for a child."""

    child_id: int
    behavioral_patterns: List[BehavioralPattern] = Field(default_factory=list)
    developmental_history: List[DevelopmentalMilestone] = Field(default_factory=list)
    successful_interventions: List[SuccessfulIntervention] = Field(default_factory=list)
    triggers_and_responses: List[TriggerResponse] = Field(default_factory=list)
    timeline_events: List[TimelineEvent] = Field(default_factory=list)
    last_updated: datetime = Field(default_factory=datetime.now)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return self.model_dump(mode='json')

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ChildMemory":
        """Create from dictionary."""
        return cls(**data)


# Helper functions for memory updates

def add_behavioral_pattern(
    memory: ChildMemory,
    behavior: str,
    context: str,
    frequency: str,
    triggers: List[str],
    severity: str = "mild"
) -> ChildMemory:
    """Add a new behavioral pattern to memory."""
    pattern = BehavioralPattern(
        behavior=behavior,
        context=context,
        frequency=frequency,
        triggers=triggers,
        severity=severity,
        first_observed=datetime.now(),
        last_observed=datetime.now()
    )
    memory.behavioral_patterns.append(pattern)
    memory.last_updated = datetime.now()
    return memory


def add_successful_intervention(
    memory: ChildMemory,
    strategy: str,
    issue_addressed: str,
    effectiveness: str,
    outcome: str,
    contexts: List[str]
) -> ChildMemory:
    """Add a successful intervention to memory."""
    intervention = SuccessfulIntervention(
        strategy=strategy,
        issue_addressed=issue_addressed,
        effectiveness=effectiveness,
        applied_date=datetime.now(),
        outcome=outcome,
        applicable_contexts=contexts
    )
    memory.successful_interventions.append(intervention)
    memory.last_updated = datetime.now()
    return memory


def add_timeline_event(
    memory: ChildMemory,
    event: str,
    category: str,
    impact: str,
    behavioral_changes: List[str] = None
) -> ChildMemory:
    """Add a timeline event to memory."""
    timeline_event = TimelineEvent(
        event=event,
        date=datetime.now(),
        category=category,
        impact=impact,
        behavioral_changes=behavioral_changes or []
    )
    memory.timeline_events.append(timeline_event)
    memory.last_updated = datetime.now()
    return memory
