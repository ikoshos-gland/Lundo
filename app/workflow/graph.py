"""LangGraph workflow for the child behavioral therapist system."""
import logging
from typing import Dict, Any, AsyncGenerator
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
    synthesize_response_streaming,
    format_output
)

logger = logging.getLogger(__name__)


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
    workflow.add_edge("call_material_consultant", "synthesize_response")
    workflow.add_edge("synthesize_response", "safety_check")
    workflow.add_edge("safety_check", "format_output")
    workflow.add_edge("format_output", END)

    return workflow


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

    logger.info(f"[WORKFLOW] Starting workflow for thread {thread_id}")

    # Create the workflow graph
    workflow = create_therapist_workflow()
    logger.info("[WORKFLOW] Workflow graph created")

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

    logger.info(f"[WORKFLOW] Connecting to postgres: {settings.postgres_connection_string}")
    
    try:
        # TEMPORARILY: Run without checkpointer to test workflow
        # TODO: Debug checkpointer.setup() hanging issue
        logger.info("[WORKFLOW] Compiling workflow WITHOUT checkpointer (temporary)")
        compiled_workflow = workflow.compile()
        logger.info("[WORKFLOW] Workflow compiled, starting invoke...")

        # Run the workflow (no persistence for now)
        final_state = await compiled_workflow.ainvoke(initial_state)
        logger.info("[WORKFLOW] Workflow completed successfully")

        return final_state
    
    except Exception as e:
        logger.error(f"[WORKFLOW] Error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise


def create_analysis_workflow():
    """
    Create a partial workflow that runs analysis steps only.
    Used for streaming - runs analysis first, then synthesis is streamed separately.
    """
    workflow = StateGraph(TherapistState)

    # Add analysis nodes only
    workflow.add_node("parse_input", parse_input)
    workflow.add_node("route_to_agents", route_to_agents)
    workflow.add_node("call_behavior_analyst", call_behavior_analyst)
    workflow.add_node("apply_psychological_perspective", apply_psychological_perspective)
    workflow.add_node("call_material_consultant", call_material_consultant)

    # Define edges
    workflow.set_entry_point("parse_input")
    workflow.add_edge("parse_input", "route_to_agents")
    workflow.add_edge("route_to_agents", "call_behavior_analyst")
    workflow.add_edge("call_behavior_analyst", "apply_psychological_perspective")
    workflow.add_edge("apply_psychological_perspective", "call_material_consultant")
    workflow.add_edge("call_material_consultant", END)

    return workflow


async def run_therapist_workflow_streaming(
    child_id: int,
    child_age: int,
    parent_id: int,
    conversation_id: int,
    thread_id: str,
    user_message: str
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Run the therapist workflow with streaming synthesis.

    First runs analysis nodes (non-streaming), then streams the synthesis.

    Args:
        child_id: Child's database ID
        child_age: Child's age in years
        parent_id: Parent's database ID
        conversation_id: Conversation database ID
        thread_id: LangGraph thread ID for state persistence
        user_message: Parent's message

    Yields:
        Events: analysis_complete, token, done
    """
    from langchain_core.messages import HumanMessage, AIMessage

    logger.info(f"[WORKFLOW_STREAM] Starting streaming workflow for thread {thread_id}")

    # Create analysis-only workflow
    analysis_workflow = create_analysis_workflow()
    compiled_analysis = analysis_workflow.compile()

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

    try:
        # Run analysis nodes
        logger.info("[WORKFLOW_STREAM] Running analysis phase...")
        analysis_state = await compiled_analysis.ainvoke(initial_state)
        logger.info("[WORKFLOW_STREAM] Analysis phase complete")

        # Signal analysis complete
        yield {"type": "analysis_complete"}

        # Now stream the synthesis
        full_response = ""
        async for token in synthesize_response_streaming(analysis_state):
            full_response += token
            yield {"type": "token", "content": token}

        # Apply safety check to the full response
        from app.safety.content_filter import filter_response

        safety_result = await filter_response(
            content=full_response,
            user_message=user_message,
            enable_hitl=False
        )

        # Update state with final response
        final_state = {
            **analysis_state,
            "synthesized_response": full_response,
            "filtered_response": safety_result["filtered_content"],
            "safety_flags": safety_result["safety_flags"],
            "requires_human_review": safety_result["requires_review"],
            "final_response": safety_result["filtered_content"] or full_response,
            "messages": [*analysis_state["messages"], AIMessage(content=full_response)]
        }

        logger.info("[WORKFLOW_STREAM] Streaming complete")

        yield {"type": "done", "state": final_state}

    except Exception as e:
        logger.error(f"[WORKFLOW_STREAM] Error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise
