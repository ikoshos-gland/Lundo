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

    # === KNOWLEDGE GATHERING PHASE ===

    # Phase tracking
    knowledge_gathering_phase: Optional[str]  # "phase_1", "phase_2", "complete", None
    is_knowledge_gathering_active: bool

    # Phase 1: Simple Questions
    phase_1_questions: list[str]  # Questions to ask in phase 1
    phase_1_current_index: int  # Current question index (0-based)
    phase_1_answers: list[Dict[str, str]]  # [{"question": str, "answer": str}]
    phase_1_question_count: int  # How many questions to ask

    # Phase 2: Follow-up Questions
    phase_2_questions: list[str]  # Follow-up questions based on phase 1
    phase_2_current_index: int  # Current follow-up question index
    phase_2_answers: list[Dict[str, str]]  # [{"question": str, "answer": str}]
    phase_2_question_count: int  # How many follow-ups needed

    # Compiled context from knowledge gathering
    gathered_knowledge: Optional[Dict[str, Any]]
    # Structure: {
    #   "initial_concern": str,
    #   "child_details": {...},
    #   "situation_context": {...},
    #   "severity_indicators": [...],
    #   "parent_goals": str,
    #   "raw_qa": list[dict]
    # }

    # Trigger conditions
    is_first_message: bool  # First message in conversation
    last_report_topic: Optional[str]  # Topic of the last full report
    report_just_given: bool  # Last response was a full report


class AgentResponse(TypedDict):
    """Response from a subagent."""
    agent_name: str
    content: str
    metadata: Dict[str, Any]
