"""Workflow nodes for the behavioral therapist system."""
import logging
from typing import Dict, Any, AsyncGenerator, Literal
from langchain_core.messages import HumanMessage, AIMessage
from langchain_openai import AzureChatOpenAI
from langgraph.types import interrupt

from app.config import settings
from app.workflow.state import TherapistState
from app.agents.subagents.behavior_analyst import behavior_analyst
from app.agents.subagents.material_consultant import material_consultant
from app.agents.subagents.simple_question_agent import simple_question_agent
from app.agents.subagents.followup_question_agent import followup_question_agent
from app.agents.subagents.knowledge_compiler import knowledge_compiler
from app.agents.skills.developmental_psychology import developmental_psychology_skill
from app.agents.skills.behaviorist import behaviorist_skill

logger = logging.getLogger(__name__)


# Initialize LLM for routing and synthesis
llm = AzureChatOpenAI(
    azure_deployment=settings.azure_openai_deployment,
    azure_endpoint=settings.azure_openai_endpoint,
    api_key=settings.azure_openai_api_key,
    api_version=settings.azure_openai_api_version
)

# Streaming LLM instance
streaming_llm = AzureChatOpenAI(
    azure_deployment=settings.azure_openai_deployment,
    azure_endpoint=settings.azure_openai_endpoint,
    api_key=settings.azure_openai_api_key,
    api_version=settings.azure_openai_api_version,
    streaming=True
)


async def parse_input(state: TherapistState) -> Dict[str, Any]:
    """
    Parse the parent's input and extract key information.

    Node: Entry point of the workflow.
    """
    # Get the latest message
    latest_message = state["messages"][-1] if state["messages"] else None

    if not latest_message:
        return state

    # Update current concern
    concern = latest_message.content if hasattr(latest_message, 'content') else str(latest_message)

    # Detect emotional state (simple keyword detection for now)
    emotional_indicators = {
        "worried": ["worried", "concerned", "anxious", "scared"],
        "frustrated": ["frustrated", "annoyed", "tired", "exhausted"],
        "confused": ["confused", "don't know", "not sure", "help"],
        "calm": ["just wondering", "curious", "question"]
    }

    detected_emotion = "neutral"
    concern_lower = concern.lower()
    for emotion, keywords in emotional_indicators.items():
        if any(keyword in concern_lower for keyword in keywords):
            detected_emotion = emotion
            break

    return {
        **state,
        "current_concern": concern,
        "parent_emotional_state": detected_emotion,
        "session_notes": {
            **state.get("session_notes", {}),
            "parsed_at": "now"
        }
    }


async def route_to_agents(state: TherapistState) -> Dict[str, Any]:
    """
    Determine which agents to call based on the concern.

    Node: Routing logic.
    """
    concern = state["current_concern"]
    child_age = state["child_age"]

    # Simple routing logic (can be enhanced with LLM-based routing)
    agents_to_call = []

    # Always call behavior analyst if we have child history
    agents_to_call.append("behavior_analyst")

    # Determine which skills to load
    active_skills = []

    # Check developmental psychology applicability
    keywords = concern.lower().split()
    is_dev_applicable, dev_score = developmental_psychology_skill.is_applicable(
        child_age, keywords
    )
    if is_dev_applicable:
        active_skills.append("developmental_psychology")

    # Check behaviorist applicability
    is_beh_applicable, beh_score = behaviorist_skill.is_applicable(
        child_age, keywords
    )
    if is_beh_applicable:
        active_skills.append("behaviorist")

    # Always call material consultant for resources
    agents_to_call.append("material_consultant")

    return {
        **state,
        "agents_to_call": agents_to_call,
        "active_skills": active_skills
    }


async def call_behavior_analyst(state: TherapistState) -> Dict[str, Any]:
    """
    Call the behavior analyst subagent.

    Node: Behavior analysis.
    """
    if "behavior_analyst" not in state.get("agents_to_call", []):
        return state

    result = await behavior_analyst.analyze(
        child_id=state["child_id"],
        current_concern=state["current_concern"],
        child_age=state["child_age"]
    )

    return {
        **state,
        "behavior_analysis": result["analysis"]
    }


async def apply_psychological_perspective(state: TherapistState) -> Dict[str, Any]:
    """
    Apply psychological framework skills.

    Node: Theoretical analysis.
    """
    active_skills = state.get("active_skills", [])
    if not active_skills:
        return state

    perspectives = []

    # Load developmental psychology if active
    if "developmental_psychology" in active_skills:
        content = developmental_psychology_skill.get_full_content()
        perspectives.append(f"## Developmental Psychology Perspective\n{content}")

    # Load behaviorist if active
    if "behaviorist" in active_skills:
        content = behaviorist_skill.get_full_content()
        perspectives.append(f"## Behaviorist Perspective\n{content}")

    # Combine perspectives
    combined_perspective = "\n\n".join(perspectives)

    # Use LLM to analyze from these perspectives
    analysis_prompt = f"""
Based on the following psychological frameworks, analyze this situation:

Child Age: {state['child_age']} years
Parent's Concern: {state['current_concern']}
Behavior Analysis: {state.get('behavior_analysis', 'Not available')}

{combined_perspective}

Provide a brief analysis (3-4 paragraphs) using the most relevant framework(s) above.
Explain:
1. Why this behavior is occurring (through the lens of the framework)
2. Whether it's developmentally normal
3. Key insights from the theoretical perspective
"""

    response = await llm.ainvoke(analysis_prompt)

    return {
        **state,
        "psychological_perspective": response.content
    }


async def call_material_consultant(state: TherapistState) -> Dict[str, Any]:
    """
    Call the material consultant subagent.

    Node: Resource recommendations.
    """
    if "material_consultant" not in state.get("agents_to_call", []):
        return state

    result = await material_consultant.recommend(
        issue=state["current_concern"],
        child_age=state["child_age"],
        additional_context=state.get("behavior_analysis", "")
    )

    return {
        **state,
        "material_recommendations": result["recommendations"]
    }


async def safety_check(state: TherapistState) -> Dict[str, Any]:
    """
    Check for safety concerns and apply content filtering.

    Uses interrupt() for human-in-the-loop when sensitive content detected.
    Requires checkpointer for state persistence.

    Node: Safety evaluation with HITL.
    """
    from app.safety.content_filter import filter_response

    # Get the synthesized response (if available)
    synthesized_response = state.get("synthesized_response", "")
    user_concern = state.get("current_concern", "")

    # Apply content safety filter
    # NOTE: HITL is disabled because checkpointer is not configured
    # TODO: Re-enable when checkpointer is working
    safety_result = await filter_response(
        content=synthesized_response,
        user_message=user_concern,
        enable_hitl=False  # Disabled until checkpointer is configured
    )

    return {
        **state,
        "filtered_response": safety_result["filtered_content"],
        "safety_flags": safety_result["safety_flags"],
        "requires_human_review": safety_result["requires_review"],
        "was_interrupted": safety_result["was_interrupted"],
        "human_decision": safety_result.get("human_decision")
    }


async def synthesize_response(state: TherapistState) -> Dict[str, Any]:
    """
    Synthesize all subagent results into a cohesive response.

    Node: Final synthesis.
    """
    # Build gathered knowledge context if available
    gathered_context = ""
    if state.get("gathered_knowledge"):
        gk = state["gathered_knowledge"]
        logger.info("[SYNTHESIS] ====== USING GATHERED KNOWLEDGE IN RESPONSE ======")
        logger.info(f"[SYNTHESIS] Initial concern: {gk.get('initial_concern', 'N/A')}")
        logger.info(f"[SYNTHESIS] Child age: {gk.get('child_details', {}).get('age', 'N/A')}")
        logger.info(f"[SYNTHESIS] Duration: {gk.get('situation_context', {}).get('duration', 'N/A')}")
        logger.info(f"[SYNTHESIS] Frequency: {gk.get('situation_context', {}).get('frequency', 'N/A')}")
        logger.info(f"[SYNTHESIS] Triggers: {gk.get('situation_context', {}).get('triggers', [])}")
        logger.info(f"[SYNTHESIS] Focus areas: {gk.get('recommended_focus_areas', [])}")
        logger.info("[SYNTHESIS] Building response with gathered knowledge context...")
        gathered_context = f"""
PARENT INTERVIEW INSIGHTS:
{'-' * 60}
Initial Concern (Refined): {gk.get('initial_concern', 'N/A')}

Child Details:
- Age: {gk.get('child_details', {}).get('age', 'N/A')}
- Developmental Stage: {gk.get('child_details', {}).get('developmental_stage', 'N/A')}
- Relevant History: {gk.get('child_details', {}).get('relevant_history', 'N/A')}

Situation Context:
- Duration: {gk.get('situation_context', {}).get('duration', 'N/A')}
- Frequency: {gk.get('situation_context', {}).get('frequency', 'N/A')}
- Triggers: {', '.join(gk.get('situation_context', {}).get('triggers', [])) or 'N/A'}
- Settings: {', '.join(gk.get('situation_context', {}).get('settings', [])) or 'N/A'}
- Previous Attempts: {gk.get('situation_context', {}).get('previous_attempts', 'N/A')}

Severity Indicators: {', '.join(gk.get('severity_indicators', [])) or 'None identified'}
Parent's Goals: {gk.get('parent_goals', 'N/A')}
Key Insights: {gk.get('key_insights', 'N/A')}
Recommended Focus Areas: {', '.join(gk.get('recommended_focus_areas', [])) or 'N/A'}

{'-' * 60}

"""
    else:
        logger.info("[SYNTHESIS] No gathered knowledge available - generating response without interview context")

    logger.info("[SYNTHESIS] Building synthesis prompt...")

    # Build synthesis prompt
    synthesis_prompt = f"""
You are an empathetic child behavioral therapist assistant. Synthesize the following
information into a warm, supportive, and actionable response for the parent.

Parent's Emotional State: {state.get('parent_emotional_state', 'neutral')}
Child's Age: {state['child_age']} years
Parent's Concern: {state['current_concern']}

{gathered_context}ANALYSIS RESULTS:
{'-' * 60}

Behavior Pattern Analysis:
{state.get('behavior_analysis', 'No historical analysis available')}

Psychological Perspective:
{state.get('psychological_perspective', 'No theoretical analysis available')}

Resource Recommendations:
{state.get('material_recommendations', 'No recommendations available')}

{'-' * 60}

Please provide a response that:
1. Acknowledges the parent's concern with empathy
2. Normalizes the behavior if it's age-appropriate (based on analysis)
3. References the child's history when relevant
4. Explains the psychological perspective in parent-friendly language
5. Provides 2-3 actionable recommendations
6. Includes specific resources (books, activities, strategies)
7. Ends with encouragement and next steps

Keep the tone warm, supportive, and empowering. Use "your child" instead of clinical terms.
Be specific and practical. Aim for 4-6 paragraphs.

{"⚠️ IMPORTANT: Include a disclaimer to consult a professional for serious concerns." if state.get('requires_human_review') else ""}
"""

    try:
        response = await llm.ainvoke(synthesis_prompt)
        synthesized_content = response.content if response and response.content else None

        if not synthesized_content:
            logger.warning("[WORKFLOW] LLM returned empty response in synthesize_response")
            synthesized_content = "I understand you're reaching out about your child. While I'm processing your concern, I want you to know that your attentiveness as a parent is valuable. Could you please share a bit more detail so I can provide more specific guidance?"

    except Exception as e:
        logger.error(f"[WORKFLOW] Error in synthesize_response LLM call: {e}")
        synthesized_content = "I apologize, but I'm having trouble processing your message right now. Please try again in a moment, or rephrase your question. Your concern is important to me."

    return {
        **state,
        "synthesized_response": synthesized_content
    }


async def format_output(state: TherapistState) -> Dict[str, Any]:
    """
    Format the final output message.

    Uses the filtered_response from safety_check which includes:
    - Safety-checked content
    - Appropriate disclaimers
    - Human-reviewed modifications (if interrupted)

    Node: Output formatting.
    """
    import logging
    logger = logging.getLogger(__name__)

    # Debug logging
    logger.info(f"[FORMAT_OUTPUT] filtered_response: {state.get('filtered_response')[:100] if state.get('filtered_response') else None}")
    logger.info(f"[FORMAT_OUTPUT] synthesized_response: {state.get('synthesized_response')[:100] if state.get('synthesized_response') else None}")

    # Use filtered response from safety check (handle None explicitly)
    final_content = (
        state.get("filtered_response")
        or state.get("synthesized_response")
        or "I apologize, but I encountered an issue processing your message. Please try again."
    )

    logger.info(f"[FORMAT_OUTPUT] final_content: {final_content[:100] if final_content else None}")

    # Create AI message with the safety-checked response
    ai_message = AIMessage(content=final_content)

    return {
        **state,
        "messages": [*state["messages"], ai_message],
        "final_response": final_content
    }


async def synthesize_response_streaming(state: TherapistState) -> AsyncGenerator[str, None]:
    """
    Stream the synthesized response token by token.

    This is a standalone function (not a graph node) that streams
    the LLM response for real-time display.

    Args:
        state: Current workflow state with analysis results

    Yields:
        Response tokens as strings
    """
    # Build gathered knowledge context if available
    gathered_context = ""
    if state.get("gathered_knowledge"):
        gk = state["gathered_knowledge"]
        logger.info("[SYNTHESIS_STREAM] ====== USING GATHERED KNOWLEDGE IN RESPONSE ======")
        logger.info(f"[SYNTHESIS_STREAM] Initial concern: {gk.get('initial_concern', 'N/A')}")
        logger.info(f"[SYNTHESIS_STREAM] Child age: {gk.get('child_details', {}).get('age', 'N/A')}")
        logger.info(f"[SYNTHESIS_STREAM] Duration: {gk.get('situation_context', {}).get('duration', 'N/A')}")
        logger.info(f"[SYNTHESIS_STREAM] Frequency: {gk.get('situation_context', {}).get('frequency', 'N/A')}")
        logger.info(f"[SYNTHESIS_STREAM] Triggers: {gk.get('situation_context', {}).get('triggers', [])}")
        logger.info(f"[SYNTHESIS_STREAM] Focus areas: {gk.get('recommended_focus_areas', [])}")
        logger.info("[SYNTHESIS_STREAM] Building response with gathered knowledge context...")
        gathered_context = f"""
PARENT INTERVIEW INSIGHTS:
{'-' * 60}
Initial Concern (Refined): {gk.get('initial_concern', 'N/A')}

Child Details:
- Age: {gk.get('child_details', {}).get('age', 'N/A')}
- Developmental Stage: {gk.get('child_details', {}).get('developmental_stage', 'N/A')}
- Relevant History: {gk.get('child_details', {}).get('relevant_history', 'N/A')}

Situation Context:
- Duration: {gk.get('situation_context', {}).get('duration', 'N/A')}
- Frequency: {gk.get('situation_context', {}).get('frequency', 'N/A')}
- Triggers: {', '.join(gk.get('situation_context', {}).get('triggers', [])) or 'N/A'}
- Settings: {', '.join(gk.get('situation_context', {}).get('settings', [])) or 'N/A'}
- Previous Attempts: {gk.get('situation_context', {}).get('previous_attempts', 'N/A')}

Severity Indicators: {', '.join(gk.get('severity_indicators', [])) or 'None identified'}
Parent's Goals: {gk.get('parent_goals', 'N/A')}
Key Insights: {gk.get('key_insights', 'N/A')}
Recommended Focus Areas: {', '.join(gk.get('recommended_focus_areas', [])) or 'N/A'}

{'-' * 60}

"""
    else:
        logger.info("[SYNTHESIS] No gathered knowledge available - generating response without interview context")

    logger.info("[SYNTHESIS] Building synthesis prompt...")

    # Build synthesis prompt
    synthesis_prompt = f"""
You are an empathetic child behavioral therapist assistant. Synthesize the following
information into a warm, supportive, and actionable response for the parent.

Parent's Emotional State: {state.get('parent_emotional_state', 'neutral')}
Child's Age: {state['child_age']} years
Parent's Concern: {state['current_concern']}

{gathered_context}ANALYSIS RESULTS:
{'-' * 60}

Behavior Pattern Analysis:
{state.get('behavior_analysis', 'No historical analysis available')}

Psychological Perspective:
{state.get('psychological_perspective', 'No theoretical analysis available')}

Resource Recommendations:
{state.get('material_recommendations', 'No recommendations available')}

{'-' * 60}

Please provide a response that:
1. Acknowledges the parent's concern with empathy
2. Normalizes the behavior if it's age-appropriate (based on analysis)
3. References the child's history when relevant
4. Explains the psychological perspective in parent-friendly language
5. Provides 2-3 actionable recommendations
6. Includes specific resources (books, activities, strategies)
7. Ends with encouragement and next steps

Keep the tone warm, supportive, and empowering. Use "your child" instead of clinical terms.
Be specific and practical. Aim for 4-6 paragraphs.

{"⚠️ IMPORTANT: Include a disclaimer to consult a professional for serious concerns." if state.get('requires_human_review') else ""}
"""

    try:
        logger.info("[SYNTHESIS_STREAM] Starting streaming synthesis...")

        # Stream the response
        async for chunk in streaming_llm.astream(synthesis_prompt):
            if chunk.content:
                yield chunk.content

        logger.info("[SYNTHESIS_STREAM] Streaming synthesis complete")

    except Exception as e:
        logger.error(f"[SYNTHESIS_STREAM] Error: {e}")
        yield "I apologize, but I'm having trouble processing your message right now. Please try again in a moment."


# ============================================================================
# KNOWLEDGE GATHERING NODES
# ============================================================================


async def check_knowledge_gathering_needed(state: TherapistState) -> Dict[str, Any]:
    """
    Determine if knowledge gathering phase should be triggered.

    Triggers when:
    1. First message of a new conversation
    2. Topic changed after a full report was given

    Node: Entry point for knowledge gathering check.
    """
    logger.info("[KNOWLEDGE_CHECK] ====== ENTERING NODE ======")
    logger.info(f"[KNOWLEDGE_CHECK] State keys: {list(state.keys())}")
    logger.info(f"[KNOWLEDGE_CHECK] is_first_message: {state.get('is_first_message')}")
    logger.info(f"[KNOWLEDGE_CHECK] report_just_given: {state.get('report_just_given')}")
    logger.info(f"[KNOWLEDGE_CHECK] last_report_topic: {state.get('last_report_topic')}")

    should_gather = False
    reason = None

    # Trigger 1: First message of conversation
    if state.get("is_first_message", False):
        should_gather = True
        reason = "first_message"
        logger.info("[KNOWLEDGE_CHECK] Triggered: First message of conversation")

    # Trigger 2: Topic changed after a report
    elif state.get("report_just_given", False) and state.get("last_report_topic"):
        # Use LLM to detect topic change
        is_new_topic = await _detect_topic_change(
            previous_topic=state["last_report_topic"],
            current_message=state["current_concern"] or state["messages"][-1].content
        )
        if is_new_topic:
            should_gather = True
            reason = "topic_change"
            logger.info("[KNOWLEDGE_CHECK] Triggered: Topic changed after report")

    logger.info(f"[KNOWLEDGE_CHECK] Result: should_gather={should_gather}, reason={reason}")

    return {
        **state,
        "is_knowledge_gathering_active": should_gather,
        "knowledge_gathering_phase": "phase_1" if should_gather else None,
    }


async def _detect_topic_change(previous_topic: str, current_message: str) -> bool:
    """
    Use LLM to detect if the current message is a new topic vs follow-up.

    Returns:
        True if this is a new topic, False if it's a follow-up
    """
    prompt = f"""Determine if the user's new message is about a NEW topic or a FOLLOW-UP to the previous topic.

Previous topic: "{previous_topic}"
New message: "{current_message}"

Respond with ONLY one word: NEW or FOLLOWUP"""

    try:
        response = await llm.ainvoke(prompt)
        result = response.content.strip().upper()
        return result == "NEW"
    except Exception as e:
        logger.error(f"[TOPIC_CHANGE] Error detecting topic change: {e}")
        return False  # Default to follow-up on error


def route_after_knowledge_check(state: TherapistState) -> Literal["generate_phase_1_questions", "parse_input"]:
    """
    Conditional edge: Route based on whether knowledge gathering is needed.

    Returns:
        "generate_phase_1_questions" - Start knowledge gathering
        "parse_input" - Skip to main workflow
    """
    if state.get("is_knowledge_gathering_active", False):
        return "generate_phase_1_questions"
    return "parse_input"


async def generate_phase_1_questions(state: TherapistState) -> Dict[str, Any]:
    """
    Generate initial questions for Phase 1 using SimpleQuestionAgent.

    Node: Phase 1 question generation.
    """
    logger.info("[PHASE_1] ====== ENTERING NODE ======")

    # Get the initial concern from the message
    initial_concern = state.get("current_concern") or ""
    if not initial_concern and state["messages"]:
        initial_concern = state["messages"][-1].content

    logger.info(f"[PHASE_1] Initial concern: {initial_concern[:100]}...")
    logger.info(f"[PHASE_1] Child age: {state.get('child_age')}")
    logger.info("[PHASE_1] Calling simple_question_agent.generate_questions()...")

    # Generate questions
    try:
        result = await simple_question_agent.generate_questions(
            initial_concern=initial_concern,
            child_age=state.get("child_age")
        )
        logger.info(f"[PHASE_1] Generated {result['question_count']} questions successfully")
    except Exception as e:
        logger.error(f"[PHASE_1] Error generating questions: {type(e).__name__}: {e}")
        raise

    return {
        **state,
        "current_concern": initial_concern,  # Ensure it's set
        "phase_1_questions": result["questions"],
        "phase_1_question_count": result["question_count"],
        "phase_1_current_index": 0,
        "phase_1_answers": [],
        "knowledge_gathering_phase": "phase_1"
    }


async def ask_phase_1_question(state: TherapistState) -> Dict[str, Any]:
    """
    Ask the current Phase 1 question and wait for user response.

    Uses LangGraph interrupt() for multi-turn conversation.

    Node: Phase 1 question asking (interruptible).
    """
    logger.info("[PHASE_1_ASK] ====== ENTERING NODE ======")
    current_idx = state["phase_1_current_index"]
    questions = state.get("phase_1_questions", [])

    logger.info(f"[PHASE_1_ASK] current_idx: {current_idx}, total questions: {len(questions)}")

    if not questions or current_idx >= len(questions):
        logger.error(f"[PHASE_1_ASK] Invalid state: no questions or index out of range")
        raise ValueError(f"Invalid phase 1 state: questions={len(questions)}, idx={current_idx}")

    question = questions[current_idx]
    logger.info(f"[PHASE_1_ASK] Asking question {current_idx + 1}/{state['phase_1_question_count']}: {question[:50]}...")

    # Interrupt to get user answer
    # The question data is returned to the caller, workflow pauses
    logger.info("[PHASE_1_ASK] Calling interrupt()...")
    interrupt_data = {
        "type": "knowledge_gathering_question",
        "phase": 1,
        "question_number": current_idx + 1,
        "total_questions": state["phase_1_question_count"],
        "question": question
    }
    logger.info(f"[PHASE_1_ASK] Interrupt data: {interrupt_data}")
    answer = interrupt(interrupt_data)

    # When resumed with Command(resume=answer), execution continues here
    logger.info(f"[PHASE_1] Received answer for question {current_idx + 1}")
    logger.info(f"[PHASE_1] Question: {question}")
    logger.info(f"[PHASE_1] Answer: {answer}")

    new_answers = list(state["phase_1_answers"]) + [{"question": question, "answer": answer}]
    logger.info(f"[PHASE_1] Total answers collected: {len(new_answers)}/{state['phase_1_question_count']}")

    return {
        **state,
        "phase_1_answers": new_answers,
        "phase_1_current_index": current_idx + 1
    }


def check_phase_1_complete(state: TherapistState) -> Literal["ask_phase_1_question", "generate_phase_2_questions"]:
    """
    Conditional edge: Check if all Phase 1 questions have been answered.

    Returns:
        "ask_phase_1_question" - More questions remaining
        "generate_phase_2_questions" - Phase 1 complete, proceed to Phase 2
    """
    if state["phase_1_current_index"] < state["phase_1_question_count"]:
        return "ask_phase_1_question"
    return "generate_phase_2_questions"


async def generate_phase_2_questions(state: TherapistState) -> Dict[str, Any]:
    """
    Generate follow-up questions based on Phase 1 answers.

    Node: Phase 2 question generation.
    """
    logger.info("[PHASE_2] Generating follow-up questions based on Phase 1 answers...")

    result = await followup_question_agent.generate_followups(
        phase_1_qa=state["phase_1_answers"],
        initial_concern=state["current_concern"],
        child_age=state.get("child_age")
    )

    logger.info(f"[PHASE_2] Generated {result['question_count']} follow-up questions")
    logger.info(f"[PHASE_2] Key insights: {result['key_insights_so_far'][:100]}...")

    return {
        **state,
        "phase_2_questions": result["questions"],
        "phase_2_question_count": result["question_count"],
        "phase_2_current_index": 0,
        "phase_2_answers": [],
        "knowledge_gathering_phase": "phase_2"
    }


async def ask_phase_2_question(state: TherapistState) -> Dict[str, Any]:
    """
    Ask the current Phase 2 follow-up question.

    Uses LangGraph interrupt() for multi-turn conversation.

    Node: Phase 2 question asking (interruptible).
    """
    current_idx = state["phase_2_current_index"]
    question = state["phase_2_questions"][current_idx]

    logger.info(f"[PHASE_2] Asking follow-up {current_idx + 1}/{state['phase_2_question_count']}: {question[:50]}...")

    # Interrupt to get user answer
    answer = interrupt({
        "type": "knowledge_gathering_question",
        "phase": 2,
        "question_number": current_idx + 1,
        "total_questions": state["phase_2_question_count"],
        "question": question
    })

    logger.info(f"[PHASE_2] Received answer for follow-up {current_idx + 1}")
    logger.info(f"[PHASE_2] Question: {question}")
    logger.info(f"[PHASE_2] Answer: {answer}")

    new_answers = list(state["phase_2_answers"]) + [{"question": question, "answer": answer}]
    logger.info(f"[PHASE_2] Total follow-up answers collected: {len(new_answers)}/{state['phase_2_question_count']}")

    return {
        **state,
        "phase_2_answers": new_answers,
        "phase_2_current_index": current_idx + 1
    }


def check_phase_2_complete(state: TherapistState) -> Literal["ask_phase_2_question", "compile_gathered_knowledge"]:
    """
    Conditional edge: Check if all Phase 2 questions have been answered.

    Returns:
        "ask_phase_2_question" - More questions remaining
        "compile_gathered_knowledge" - Phase 2 complete, compile knowledge
    """
    if state["phase_2_current_index"] < state["phase_2_question_count"]:
        return "ask_phase_2_question"
    return "compile_gathered_knowledge"


async def compile_gathered_knowledge(state: TherapistState) -> Dict[str, Any]:
    """
    Compile all Q&A into structured knowledge for the main workflow.

    Node: Knowledge compilation.
    """
    logger.info("[COMPILE] ====== COMPILING GATHERED KNOWLEDGE ======")
    logger.info(f"[COMPILE] Phase 1 Q&A pairs: {len(state['phase_1_answers'])}")
    for i, qa in enumerate(state['phase_1_answers'], 1):
        logger.info(f"[COMPILE]   Q{i}: {qa['question']}")
        logger.info(f"[COMPILE]   A{i}: {qa['answer']}")

    logger.info(f"[COMPILE] Phase 2 Q&A pairs: {len(state['phase_2_answers'])}")
    for i, qa in enumerate(state['phase_2_answers'], 1):
        logger.info(f"[COMPILE]   Q{i}: {qa['question']}")
        logger.info(f"[COMPILE]   A{i}: {qa['answer']}")

    compiled = await knowledge_compiler.compile(
        phase_1_qa=state["phase_1_answers"],
        phase_2_qa=state["phase_2_answers"],
        initial_concern=state["current_concern"],
        child_age=state.get("child_age")
    )

    logger.info("[COMPILE] ====== COMPILED KNOWLEDGE RESULT ======")
    logger.info(f"[COMPILE] Initial concern (refined): {compiled.get('initial_concern', 'N/A')}")
    logger.info(f"[COMPILE] Child details: {compiled.get('child_details', {})}")
    logger.info(f"[COMPILE] Situation context: {compiled.get('situation_context', {})}")
    logger.info(f"[COMPILE] Severity indicators: {compiled.get('severity_indicators', [])}")
    logger.info(f"[COMPILE] Parent goals: {compiled.get('parent_goals', 'N/A')}")
    logger.info(f"[COMPILE] Key insights: {compiled.get('key_insights', 'N/A')}")
    logger.info(f"[COMPILE] Recommended focus areas: {compiled.get('recommended_focus_areas', [])}")

    return {
        **state,
        "gathered_knowledge": compiled,
        "knowledge_gathering_phase": "complete",
        "is_knowledge_gathering_active": False
    }
