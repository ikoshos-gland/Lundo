"""LangGraph workflow for the child behavioral therapist system."""
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from app.config import settings
from app.workflow.state import TherapistState
from app.workflow.nodes import (
    parse_input,
    route_to_agents,
    call_behavior_analyst,
    apply_psychological_perspective,
    call_material_consultant,
    safety_check,
    synthesize_response,
    format_output
)


def create_therapist_workflow():
    """
    Create the LangGraph workflow for the therapist system.

    Workflow:
    1. Parse Input → Extract concern and emotional state
    2. Route to Agents → Decide which subagents to call
    3. Call Behavior Analyst → Analyze patterns (parallel)
    4. Apply Psychological Perspective → Load skills (parallel)
    5. Call Material Consultant → Get recommendations (parallel)
    6. Safety Check → Flag concerning content
    7. Synthesize Response → Combine all insights
    8. Format Output → Create final message
    """

    # Create the state graph
    workflow = StateGraph(TherapistState)

    # Add nodes
    workflow.add_node("parse_input", parse_input)
    workflow.add_node("route_to_agents", route_to_agents)
    workflow.add_node("call_behavior_analyst", call_behavior_analyst)
    workflow.add_node("apply_psychological_perspective", apply_psychological_perspective)
    workflow.add_node("call_material_consultant", call_material_consultant)
    workflow.add_node("safety_check", safety_check)
    workflow.add_node("synthesize_response", synthesize_response)
    workflow.add_node("format_output", format_output)

    # Define edges (workflow flow)
    workflow.set_entry_point("parse_input")

    # Sequential flow for critical path
    workflow.add_edge("parse_input", "route_to_agents")
    workflow.add_edge("route_to_agents", "call_behavior_analyst")
    workflow.add_edge("call_behavior_analyst", "apply_psychological_perspective")
    workflow.add_edge("apply_psychological_perspective", "call_material_consultant")
    workflow.add_edge("call_material_consultant", "safety_check")
    workflow.add_edge("safety_check", "synthesize_response")
    workflow.add_edge("synthesize_response", "format_output")
    workflow.add_edge("format_output", END)

    return workflow


async def create_compiled_workflow():
    """
    Create and compile the workflow with checkpointer.

    Returns:
        Compiled workflow ready for execution
    """
    workflow = create_therapist_workflow()

    # Create checkpointer for conversation state persistence
    checkpointer = AsyncPostgresSaver.from_conn_string(
        settings.database_url
    )
    await checkpointer.setup()

    # Compile the workflow
    compiled_workflow = workflow.compile(
        checkpointer=checkpointer,
        # interrupt_before=["synthesize_response"]  # Uncomment for human-in-the-loop
    )

    return compiled_workflow


async def run_therapist_workflow(
    child_id: int,
    child_age: int,
    parent_id: int,
    conversation_id: int,
    thread_id: str,
    user_message: str
) -> dict:
    """
    Run the therapist workflow for a user message.

    Args:
        child_id: Child's database ID
        child_age: Child's age in years
        parent_id: Parent's database ID
        conversation_id: Conversation database ID
        thread_id: LangGraph thread ID for state persistence
        user_message: Parent's message

    Returns:
        Final state after workflow execution
    """
    from langchain_core.messages import HumanMessage

    # Create compiled workflow
    workflow = await create_compiled_workflow()

    # Initial state
    initial_state = {
        "messages": [HumanMessage(content=user_message)],
        "child_id": child_id,
        "child_age": child_age,
        "parent_id": parent_id,
        "conversation_id": conversation_id,
        "thread_id": thread_id,
        "current_concern": "",
        "parent_emotional_state": None,
        "behavior_analysis": None,
        "psychological_perspective": None,
        "material_recommendations": None,
        "active_skills": [],
        "agents_to_call": [],
        "final_response": None,
        "requires_human_review": False,
        "safety_flags": [],
        "session_notes": {}
    }

    # Configuration with thread_id for persistence
    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    # Run the workflow
    final_state = await workflow.ainvoke(initial_state, config=config)

    return final_state
