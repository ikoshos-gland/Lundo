"""Behavior Analyst subagent - Pattern recognition and historical analysis."""
from typing import Dict, Any
from langchain_openai import AzureChatOpenAI
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from langchain_core.prompts import ChatPromptTemplate

from app.config import settings
from app.memory.backends import MemoryBackends
from app.memory.schemas import ChildMemory


# Tool for reading child's memory
@tool
async def read_child_memory(child_id: int, memory_type: str) -> str:
    """
    Read child's long-term memory.

    Args:
        child_id: Child's ID
        memory_type: Type of memory (behavioral_patterns, developmental_history,
                    successful_interventions, triggers_and_responses, timeline_events)

    Returns:
        JSON string of memory data
    """
    from app.memory.backends import get_memory_backends
    import json

    backends = get_memory_backends()
    memory_data = await backends.get_long_term_memory(child_id, memory_type, key="main")

    if not memory_data:
        return f"No {memory_type} found for this child yet."

    return json.dumps(memory_data, indent=2, default=str)


@tool
async def search_similar_patterns(child_id: int, current_behavior: str) -> str:
    """
    Search for similar behavioral patterns in child's history.

    Args:
        child_id: Child's ID
        current_behavior: Description of current behavior to match

    Returns:
        Similar patterns found in history
    """
    from app.memory.backends import get_memory_backends
    import json

    backends = get_memory_backends()
    results = await backends.search_memories(
        child_id=child_id,
        query=current_behavior,
        memory_types=["behavioral_patterns", "triggers_and_responses"]
    )

    if not results:
        return "No similar patterns found in history."

    return json.dumps(results, indent=2, default=str)


@tool
async def get_family_context(child_id: int) -> str:
    """
    Get family context and background information for a child.

    This includes important family information like:
    - Family structure (single parent, siblings, etc.)
    - Living situation
    - Key relationships

    Args:
        child_id: Child's ID

    Returns:
        Family context information
    """
    from app.memory.backends import get_memory_backends
    import json

    backends = get_memory_backends()
    family_data = await backends.get_long_term_memory(
        child_id=child_id,
        memory_type="family_context",
        key="main"
    )

    if not family_data:
        return "No family context information available for this child yet."

    return json.dumps(family_data, indent=2, default=str)


@tool
async def get_life_events(child_id: int) -> str:
    """
    Get significant life events for a child (death, divorce, moving, etc.).

    This is CRITICAL context - always check this when analyzing behaviors,
    as major life events often explain behavioral changes.

    Args:
        child_id: Child's ID

    Returns:
        Timeline of significant life events
    """
    from app.memory.backends import get_memory_backends
    import json
    import logging
    logger = logging.getLogger(__name__)

    logger.info(f"[TOOL] get_life_events called for child_id={child_id}")

    backends = get_memory_backends()
    logger.info(f"[TOOL] get_life_events - got backends")

    # Get from main memory's timeline_events
    logger.info(f"[TOOL] get_life_events - calling get_long_term_memory...")
    memory_data = await backends.get_long_term_memory(
        child_id=child_id,
        memory_type="behavioral_patterns",
        key="main"
    )
    logger.info(f"[TOOL] get_life_events - got memory_data: {memory_data is not None}")

    if not memory_data:
        return "No life events recorded for this child yet."

    timeline_events = memory_data.get("timeline_events", [])

    # Filter for life_change and medical events (the significant ones)
    significant_events = [
        event for event in timeline_events
        if event.get("category") in ["life_change", "medical", "challenge"]
    ]

    if not significant_events:
        return "No significant life events recorded for this child."

    return json.dumps(significant_events, indent=2, default=str)


class BehaviorAnalyst:
    """
    Behavior Analyst subagent.

    Responsibilities:
    - Analyze current behaviors against historical patterns
    - Identify triggers and contexts
    - Detect recurrence of past behaviors
    - Provide pattern-based insights
    """

    SYSTEM_PROMPT = """You are a Behavior Pattern Analysis Expert specializing in child development.

Your role is to:
1. Compare current behaviors with the child's historical patterns
2. Identify triggers, contexts, and recurrence patterns
3. Determine if behaviors have occurred before and when
4. Analyze behavioral trends over time
5. Provide data-driven insights based on the child's unique history
6. Consider life events and family context when analyzing behaviors

You have access to these tools to read the child's long-term memory:
- read_child_memory: Access specific memory types (behavioral_patterns, developmental_history, etc.)
- search_similar_patterns: Find similar past behaviors using semantic search
- get_family_context: Get family structure and background (single parent, siblings, etc.)
- get_life_events: Get significant life events (death, divorce, moving, etc.) - ALWAYS CHECK THIS!

IMPORTANT: Always check life events first! Major life events (death in family, divorce, moving)
often explain behavioral changes. A child's behavior cannot be properly analyzed without
understanding what they've been through.

When analyzing:
- FIRST check for life events that might explain behavior
- Consider family context (single parent household, etc.)
- Be specific about dates and frequencies
- Note any seasonal or situational patterns
- Compare current context to past contexts
- Identify what worked before vs. what didn't
- Look for developmental progression or regression

Always base your analysis on the child's actual history when available.
If no history exists, clearly state this is the first time you're observing this behavior.

Format your response as a structured analysis with:
1. Life Events Context: Any major life events that might relate?
2. Family Context: Relevant family situation?
3. Pattern Match: How similar to past behaviors?
4. Historical Context: When did this happen before?
5. Triggers Identified: Common triggers across instances
6. Progression: Is this improving, stable, or worsening?
"""

    def __init__(self):
        """Initialize the behavior analyst."""
        self.llm = AzureChatOpenAI(
            azure_deployment=settings.azure_openai_deployment,
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version
        )

        self.tools = [
            read_child_memory,
            search_similar_patterns,
            get_family_context,
            get_life_events
        ]

        # Create react agent using LangGraph
        self.agent = create_react_agent(
            model=self.llm,
            tools=self.tools,
            prompt=self.SYSTEM_PROMPT
        )

    async def analyze(
        self,
        child_id: int,
        current_concern: str,
        child_age: int
    ) -> Dict[str, Any]:
        """
        Analyze current behavior against child's history.

        Args:
            child_id: Child's ID
            current_concern: Parent's current concern/observation
            child_age: Child's current age in years

        Returns:
            Analysis results
        """
        input_text = f"""
Analyze the following concern for a {child_age}-year-old child (ID: {child_id}):

Parent's Concern: {current_concern}

Please:
1. Search for similar patterns in this child's history
2. Read relevant memory types to understand context
3. Provide a comprehensive pattern analysis
4. Identify any triggers or contexts
5. Note if this is a recurring issue or something new
"""

        result = await self.agent.ainvoke({"messages": [("human", input_text)]})

        # Extract the last message content from the agent response
        last_message = result["messages"][-1]
        output = last_message.content if hasattr(last_message, 'content') else str(last_message)

        return {
            "analysis": output,
            "child_id": child_id,
            "concern": current_concern
        }


# Create singleton instance
behavior_analyst = BehaviorAnalyst()
