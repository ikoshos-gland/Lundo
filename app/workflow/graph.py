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
    format_output,
    # Knowledge gathering nodes
    check_knowledge_gathering_needed,
    generate_phase_1_questions,
    ask_phase_1_question,
    generate_phase_2_questions,
    ask_phase_2_question,
    compile_gathered_knowledge,
    # Conditional edge functions
    route_after_knowledge_check,
    check_phase_1_complete,
    check_phase_2_complete,
)

logger = logging.getLogger(__name__)


def create_therapist_workflow():
    """
    Create the LangGraph workflow for the therapist system.

    Workflow with Knowledge Gathering:
    0. Check Knowledge Gathering Needed → Decide if we need to gather more info
       ↓ (if needed)
    1. Generate Phase 1 Questions → Create initial questions
    2. Ask Phase 1 Question → Ask questions one-by-one (with interrupt)
    3. Generate Phase 2 Questions → Create follow-up questions
    4. Ask Phase 2 Question → Ask follow-ups one-by-one (with interrupt)
    5. Compile Gathered Knowledge → Structure all Q&A
       ↓ (or skip directly here if not needed)
    6. Parse Input → Extract concern and emotional state
    7. Route to Agents → Decide which subagents to call
    8. Call Behavior Analyst → Analyze patterns
    9. Apply Psychological Perspective → Load skills
    10. Call Material Consultant → Get recommendations
    11. Synthesize Response → Combine all insights
    12. Safety Check → Flag concerning content
    13. Format Output → Create final message
    """

    # Create the state graph
    workflow = StateGraph(TherapistState)

    # === KNOWLEDGE GATHERING NODES ===
    workflow.add_node("check_knowledge_gathering_needed", check_knowledge_gathering_needed)
    workflow.add_node("generate_phase_1_questions", generate_phase_1_questions)
    workflow.add_node("ask_phase_1_question", ask_phase_1_question)
    workflow.add_node("generate_phase_2_questions", generate_phase_2_questions)
    workflow.add_node("ask_phase_2_question", ask_phase_2_question)
    workflow.add_node("compile_gathered_knowledge", compile_gathered_knowledge)

    # === MAIN WORKFLOW NODES ===
    workflow.add_node("parse_input", parse_input)
    workflow.add_node("route_to_agents", route_to_agents)
    workflow.add_node("call_behavior_analyst", call_behavior_analyst)
    workflow.add_node("apply_psychological_perspective", apply_psychological_perspective)
    workflow.add_node("call_material_consultant", call_material_consultant)
    workflow.add_node("safety_check", safety_check)
    workflow.add_node("synthesize_response", synthesize_response)
    workflow.add_node("format_output", format_output)

    # === ENTRY POINT ===
    workflow.set_entry_point("check_knowledge_gathering_needed")

    # === KNOWLEDGE GATHERING EDGES ===

    # From check → either start gathering or skip to main workflow
    workflow.add_conditional_edges(
        "check_knowledge_gathering_needed",
        route_after_knowledge_check,
        {
            "generate_phase_1_questions": "generate_phase_1_questions",
            "parse_input": "parse_input"
        }
    )

    # Phase 1 flow
    workflow.add_edge("generate_phase_1_questions", "ask_phase_1_question")
    workflow.add_conditional_edges(
        "ask_phase_1_question",
        check_phase_1_complete,
        {
            "ask_phase_1_question": "ask_phase_1_question",  # Loop for more questions
            "generate_phase_2_questions": "generate_phase_2_questions"
        }
    )

    # Phase 2 flow
    workflow.add_edge("generate_phase_2_questions", "ask_phase_2_question")
    workflow.add_conditional_edges(
        "ask_phase_2_question",
        check_phase_2_complete,
        {
            "ask_phase_2_question": "ask_phase_2_question",  # Loop for more questions
            "compile_gathered_knowledge": "compile_gathered_knowledge"
        }
    )

    # After compilation → main workflow
    workflow.add_edge("compile_gathered_knowledge", "parse_input")

    # === MAIN WORKFLOW EDGES ===
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

    # Initial state with knowledge gathering fields
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
        "synthesized_response": None,
        "filtered_response": None,
        "requires_human_review": False,
        "safety_flags": [],
        "was_interrupted": False,
        "human_decision": None,
        "session_notes": {},
        # Knowledge gathering fields
        "knowledge_gathering_phase": None,
        "is_knowledge_gathering_active": False,
        "phase_1_questions": [],
        "phase_1_current_index": 0,
        "phase_1_answers": [],
        "phase_1_question_count": 0,
        "phase_2_questions": [],
        "phase_2_current_index": 0,
        "phase_2_answers": [],
        "phase_2_question_count": 0,
        "gathered_knowledge": None,
        "is_first_message": False,
        "last_report_topic": None,
        "report_just_given": False,
    }

    # Configuration with thread_id for persistence
    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    logger.info(f"[WORKFLOW] Connecting to postgres: {settings.postgres_connection_string}")

    try:
        # Use AsyncPostgresSaver as context manager (required for proper connection handling)
        async with AsyncPostgresSaver.from_conn_string(settings.postgres_connection_string) as checkpointer:
            logger.info("[WORKFLOW] Checkpointer context entered, running setup...")
            await checkpointer.setup()
            logger.info("[WORKFLOW] Checkpointer setup complete")

            # Compile workflow with checkpointer for state persistence
            compiled_workflow = workflow.compile(checkpointer=checkpointer)
            logger.info("[WORKFLOW] Workflow compiled with checkpointer, starting invoke...")

            # Run the workflow with persistence
            final_state = await compiled_workflow.ainvoke(initial_state, config)
            logger.info("[WORKFLOW] Workflow completed successfully")

            return final_state

    except Exception as e:
        logger.error(f"[WORKFLOW] Error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise


def create_analysis_workflow():
    """
    Create a partial workflow that runs analysis steps only.
    Used for streaming - runs analysis first, then synthesis is streamed separately.

    Includes knowledge gathering phase which uses interrupts.
    """
    workflow = StateGraph(TherapistState)

    # === KNOWLEDGE GATHERING NODES ===
    workflow.add_node("check_knowledge_gathering_needed", check_knowledge_gathering_needed)
    workflow.add_node("generate_phase_1_questions", generate_phase_1_questions)
    workflow.add_node("ask_phase_1_question", ask_phase_1_question)
    workflow.add_node("generate_phase_2_questions", generate_phase_2_questions)
    workflow.add_node("ask_phase_2_question", ask_phase_2_question)
    workflow.add_node("compile_gathered_knowledge", compile_gathered_knowledge)

    # === ANALYSIS NODES ===
    workflow.add_node("parse_input", parse_input)
    workflow.add_node("route_to_agents", route_to_agents)
    workflow.add_node("call_behavior_analyst", call_behavior_analyst)
    workflow.add_node("apply_psychological_perspective", apply_psychological_perspective)
    workflow.add_node("call_material_consultant", call_material_consultant)

    # === ENTRY POINT ===
    workflow.set_entry_point("check_knowledge_gathering_needed")

    # === KNOWLEDGE GATHERING EDGES ===
    workflow.add_conditional_edges(
        "check_knowledge_gathering_needed",
        route_after_knowledge_check,
        {
            "generate_phase_1_questions": "generate_phase_1_questions",
            "parse_input": "parse_input"
        }
    )

    # Phase 1 flow
    workflow.add_edge("generate_phase_1_questions", "ask_phase_1_question")
    workflow.add_conditional_edges(
        "ask_phase_1_question",
        check_phase_1_complete,
        {
            "ask_phase_1_question": "ask_phase_1_question",
            "generate_phase_2_questions": "generate_phase_2_questions"
        }
    )

    # Phase 2 flow
    workflow.add_edge("generate_phase_2_questions", "ask_phase_2_question")
    workflow.add_conditional_edges(
        "ask_phase_2_question",
        check_phase_2_complete,
        {
            "ask_phase_2_question": "ask_phase_2_question",
            "compile_gathered_knowledge": "compile_gathered_knowledge"
        }
    )

    # After compilation → main analysis
    workflow.add_edge("compile_gathered_knowledge", "parse_input")

    # === ANALYSIS EDGES ===
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
    user_message: str,
    is_first_message: bool = False,
    last_report_topic: str = None
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
        is_first_message: Whether this is the first message in the conversation
        last_report_topic: Topic of the last full report (for topic change detection)

    Yields:
        Events: analysis_complete, token, done, interrupt (for knowledge gathering)
    """
    import asyncio
    from langchain_core.messages import HumanMessage, AIMessage

    logger.info(f"[WORKFLOW_STREAM] Starting streaming workflow for thread {thread_id}")
    logger.info(f"[WORKFLOW_STREAM] is_first_message={is_first_message}, last_report_topic={last_report_topic}")

    # Configuration with thread_id for persistence
    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    # Initial state with all knowledge gathering fields
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
        "synthesized_response": None,
        "filtered_response": None,
        "requires_human_review": False,
        "safety_flags": [],
        "was_interrupted": False,
        "human_decision": None,
        "session_notes": {},
        # Knowledge gathering fields
        "knowledge_gathering_phase": None,
        "is_knowledge_gathering_active": False,
        "phase_1_questions": [],
        "phase_1_current_index": 0,
        "phase_1_answers": [],
        "phase_1_question_count": 0,
        "phase_2_questions": [],
        "phase_2_current_index": 0,
        "phase_2_answers": [],
        "phase_2_question_count": 0,
        "gathered_knowledge": None,
        "is_first_message": is_first_message,
        "last_report_topic": last_report_topic,
        "report_just_given": last_report_topic is not None,
    }

    try:
        # Use AsyncPostgresSaver as context manager for checkpointing
        logger.info(f"[WORKFLOW_STREAM] Connecting to postgres for checkpointer...")
        async with AsyncPostgresSaver.from_conn_string(settings.postgres_connection_string) as checkpointer:
            logger.info("[WORKFLOW_STREAM] Checkpointer context entered, running setup...")
            try:
                # Add timeout to setup to prevent hanging
                await asyncio.wait_for(checkpointer.setup(), timeout=30.0)
                logger.info("[WORKFLOW_STREAM] Checkpointer setup complete")
            except asyncio.TimeoutError:
                logger.error("[WORKFLOW_STREAM] Checkpointer setup timed out after 30s")
                raise Exception("Checkpointer setup timed out")

            # Create analysis-only workflow with checkpointer
            logger.info("[WORKFLOW_STREAM] Creating analysis workflow...")
            analysis_workflow = create_analysis_workflow()
            logger.info("[WORKFLOW_STREAM] Compiling analysis workflow with checkpointer...")
            compiled_analysis = analysis_workflow.compile(checkpointer=checkpointer)
            logger.info("[WORKFLOW_STREAM] Workflow compiled successfully")

            # Run analysis nodes using astream to detect interrupts
            logger.info("[WORKFLOW_STREAM] Running analysis phase with astream...")
            analysis_state = None
            event_count = 0

            async for event in compiled_analysis.astream(initial_state, config, stream_mode="updates"):
                event_count += 1
                logger.info(f"[WORKFLOW_STREAM] Received event #{event_count}: {list(event.keys())}")
                # Check for interrupt (knowledge gathering question)
                if "__interrupt__" in event:
                    interrupt_value = event["__interrupt__"][0].value
                    logger.info(f"[WORKFLOW_STREAM] Interrupt detected: {interrupt_value.get('question', '')[:50]}...")

                    # Stream the question text character by character for typing effect
                    question_text = interrupt_value.get("question", "")
                    await asyncio.sleep(1.0)  # 1 second pause before typing starts
                    for char in question_text:
                        yield {"type": "token", "content": char}
                        await asyncio.sleep(0.015)  # Small delay for typing effect

                    # Then send the question metadata (without text, since it was streamed)
                    question_metadata = {
                        "type": interrupt_value.get("type"),
                        "phase": interrupt_value.get("phase"),
                        "question_number": interrupt_value.get("question_number"),
                        "total_questions": interrupt_value.get("total_questions"),
                    }
                    yield {"type": "interrupt", "data": question_metadata}
                    return  # Stop workflow, client will call resume endpoint

                # Capture the final state from each node update
                for node_name, node_state in event.items():
                    if node_name != "__interrupt__":
                        analysis_state = node_state

            # Get the complete state after workflow finishes
            state_snapshot = await compiled_analysis.aget_state(config)
            analysis_state = state_snapshot.values

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
