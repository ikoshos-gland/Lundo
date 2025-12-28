"""Workflow state definition for LangGraph."""
from typing import TypedDict, Annotated, Sequence, Optional, Dict, Any, List
from enum import Enum
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class ExplorationPhase(str, Enum):
    """Exploration workflow phases."""
    NOT_STARTED = "not_started"
    EXPLORATION_QUESTIONS = "exploration_questions"
    DEEP_QUESTIONS = "deep_questions"
    COMPLETED = "completed"


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
    synthesized_response: Optional[str]
    filtered_response: Optional[str]

    # Safety checks
    requires_human_review: bool
    safety_flags: list[str]

    # Human-in-the-loop
    was_interrupted: bool
    human_decision: Optional[str]

    # Metadata
    conversation_id: int
    thread_id: str
    session_notes: Dict[str, Any]

    # Exploration phase tracking
    exploration_phase: str  # ExplorationPhase value
    exploration_question_index: int  # 0-4 for each phase
    exploration_qa: List[Dict[str, str]]  # [{"question": "...", "answer": "..."}]
    deep_qa: List[Dict[str, str]]  # [{"question": "...", "answer": "..."}]
    initial_concern: str  # The triggering concern that started exploration
    exploration_topic_id: Optional[str]  # UUID linking Q&A to specific topic
    current_question: Optional[str]  # Current question being asked
    current_question_type: Optional[str]  # "exploration" or "deep"


class AgentResponse(TypedDict):
    """Response from a subagent."""
    agent_name: str
    content: str
    metadata: Dict[str, Any]
