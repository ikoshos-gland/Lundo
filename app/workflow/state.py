"""Workflow state definition for LangGraph."""
from typing import TypedDict, Annotated, Sequence, Optional, Dict, Any
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class TherapistState(TypedDict):
    """
    State for the child behavioral therapist workflow.

    This state is passed between nodes in the LangGraph workflow.
    """

    # Conversation messages
    messages: Annotated[Sequence[BaseMessage], add_messages]

    # Child and parent information
    child_id: int
    child_age: int
    parent_id: int

    # Current concern/input
    current_concern: str
    parent_emotional_state: Optional[str]

    # Analysis results from subagents
    behavior_analysis: Optional[str]
    psychological_perspective: Optional[str]
    material_recommendations: Optional[str]

    # Skills loaded
    active_skills: list[str]

    # Routing decisions
    agents_to_call: list[str]

    # Final synthesis
    final_response: Optional[str]

    # Safety checks
    requires_human_review: bool
    safety_flags: list[str]

    # Metadata
    conversation_id: int
    thread_id: str
    session_notes: Dict[str, Any]


class AgentResponse(TypedDict):
    """Response from a subagent."""
    agent_name: str
    content: str
    metadata: Dict[str, Any]
