"""Workflow nodes for the behavioral therapist system."""
from typing import Dict, Any
from langchain_core.messages import HumanMessage, AIMessage
from langchain_openai import AzureChatOpenAI

from app.config import settings
from app.workflow.state import TherapistState
from app.agents.subagents.behavior_analyst import behavior_analyst
from app.agents.subagents.material_consultant import material_consultant
from app.agents.skills.developmental_psychology import developmental_psychology_skill
from app.agents.skills.behaviorist import behaviorist_skill


# Initialize LLM for routing and synthesis
llm = AzureChatOpenAI(
    azure_deployment=settings.azure_openai_deployment,
    azure_endpoint=settings.azure_openai_endpoint,
    api_key=settings.azure_openai_api_key,
    api_version=settings.azure_openai_api_version
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
    # This may interrupt execution if sensitive content is detected
    safety_result = await filter_response(
        content=synthesized_response,
        user_message=user_concern,
        enable_hitl=True  # Enable human-in-the-loop
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
    import logging
    logger = logging.getLogger(__name__)

    # Build synthesis prompt
    synthesis_prompt = f"""
You are an empathetic child behavioral therapist assistant. Synthesize the following
information into a warm, supportive, and actionable response for the parent.

Parent's Emotional State: {state.get('parent_emotional_state', 'neutral')}
Child's Age: {state['child_age']} years
Parent's Concern: {state['current_concern']}

ANALYSIS RESULTS:
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
