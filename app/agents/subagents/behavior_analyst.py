"""Behavior Analyst subagent - Pattern recognition and historical analysis."""
from typing import Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.tools import tool
from langchain.agents import create_tool_calling_agent, AgentExecutor
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
    from app.config import settings
    from app.memory.backends import MemoryBackends
    import json

    backends = MemoryBackends(settings.database_url)
    memory_data = await backends.get_long_term_memory(child_id, memory_type)

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
    from app.config import settings
    from app.memory.backends import MemoryBackends
    import json

    backends = MemoryBackends(settings.database_url)
    results = await backends.search_memories(
        child_id=child_id,
        query=current_behavior,
        memory_types=["behavioral_patterns", "triggers_and_responses"]
    )

    if not results:
        return "No similar patterns found in history."

    return json.dumps(results, indent=2, default=str)


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

You have access to tools to read the child's long-term memory:
- read_child_memory: Access specific memory types
- search_similar_patterns: Find similar past behaviors

When analyzing:
- Be specific about dates and frequencies
- Note any seasonal or situational patterns
- Compare current context to past contexts
- Identify what worked before vs. what didn't
- Look for developmental progression or regression

Always base your analysis on the child's actual history when available.
If no history exists, clearly state this is the first time you're observing this behavior.

Format your response as a structured analysis with:
1. Pattern Match: How similar to past behaviors?
2. Historical Context: When did this happen before?
3. Triggers Identified: Common triggers across instances
4. Progression: Is this improving, stable, or worsening?
5. Relevant History: What past events might relate?
"""

    def __init__(self):
        """Initialize the behavior analyst."""
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro",
            google_api_key=settings.google_api_key,
            temperature=0.3  # Lower temperature for more factual analysis
        )

        self.tools = [read_child_memory, search_similar_patterns]

        # Create prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.SYSTEM_PROMPT),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}")
        ])

        # Create agent
        self.agent = create_tool_calling_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=self.prompt
        )

        self.executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True,
            max_iterations=5
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

        result = await self.executor.ainvoke({"input": input_text})

        return {
            "analysis": result["output"],
            "child_id": child_id,
            "concern": current_concern
        }


# Create singleton instance
behavior_analyst = BehaviorAnalyst()
