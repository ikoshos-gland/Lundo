"""Deep Question Agent - Memory-enhanced deep questioning using child history."""
import logging
from typing import Dict, Any, List

from langchain_openai import AzureChatOpenAI
from langgraph.prebuilt import create_react_agent

from app.config import settings
from app.agents.subagents.behavior_analyst import (
    read_child_memory,
    search_similar_patterns,
    get_family_context,
    get_life_events
)

logger = logging.getLogger(__name__)


class DeepQuestionAgent:
    """
    Deep Question Agent for memory-informed deep questioning.

    Asks 5 deeper questions (questions 6-10) that are informed by:
    - The child's memory and history
    - Answers from the exploration phase
    - Pattern matching with past behaviors

    Uses ReAct pattern with memory tools to access child history.
    """

    SYSTEM_PROMPT = """You are a deep analysis expert for child behavioral therapy.

You have access to the child's history and the exploration phase answers. Your role is to
ask ONE penetrating question that will provide crucial context for the therapist.

You are asking question {question_number} of 10 (deep question {deep_question_number} of 5).

IMPORTANT RULES:
1. Ask ONLY ONE question per turn - do not include multiple questions
2. FIRST use your tools to gather relevant history about this child
3. Use the child's history to ask RELEVANT questions
4. Connect current concerns to historical patterns if applicable
5. Focus on deeper understanding: WHY, underlying emotions, unmet needs

TOOLS AVAILABLE:
- read_child_memory: Get behavioral patterns, timeline events, etc.
- search_similar_patterns: Find related past behaviors
- get_family_context: Understand family situation
- get_life_events: Check for significant events (ALWAYS CHECK THIS FIRST!)

CONTEXT:
- Child ID: {child_id}
- Child Age: {child_age} years old
- Initial Concern: {initial_concern}

EXPLORATION PHASE ANSWERS:
{exploration_qa}

{previous_deep_context}

QUESTION FOCUS FOR DEEP PHASE:
- Deep Q1 (Q6): Explore EMOTIONAL dimensions - what might the child be feeling?
- Deep Q2 (Q7): Investigate ROOT CAUSES - what could be driving this behavior?
- Deep Q3 (Q8): Examine PATTERNS - is this connected to past events or behaviors?
- Deep Q4 (Q9): Assess UNMET NEEDS - what might the child be trying to communicate?
- Deep Q5 (Q10): Consider CONTEXT FACTORS - environment, relationships, changes?

PROCESS:
1. Use tools to check the child's history (especially life events!)
2. Analyze the exploration answers for patterns
3. Generate a question that digs deeper into the underlying issues

If no relevant history exists, ask questions that help uncover:
- Underlying emotions the child might be experiencing
- What the child might be trying to communicate through behavior
- Environmental or relationship factors
- How parents have responded and what patterns emerged

Output ONLY the question - no preamble, explanation, or tool call summaries."""

    def __init__(self):
        """Initialize the deep question agent."""
        self.llm = AzureChatOpenAI(
            azure_deployment=settings.azure_openai_deployment,
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            temperature=0.7
        )

        self.tools = [
            read_child_memory,
            search_similar_patterns,
            get_family_context,
            get_life_events
        ]

        # Create react agent with tools
        self.agent = create_react_agent(
            model=self.llm,
            tools=self.tools
        )

    async def generate_question(
        self,
        question_number: int,
        child_id: int,
        child_age: int,
        initial_concern: str,
        exploration_qa: List[Dict[str, str]],
        previous_deep_qa: List[Dict[str, str]]
    ) -> str:
        """
        Generate a memory-informed deep question.

        Args:
            question_number: Which question (6-10)
            child_id: Child's database ID
            child_age: Child's age in years
            initial_concern: The parent's initial message/concern
            exploration_qa: Q&A pairs from exploration phase
            previous_deep_qa: Previous deep Q&A pairs

        Returns:
            The next deep question to ask
        """
        deep_question_number = question_number - 5  # Convert 6-10 to 1-5
        logger.info(f"[DEEP_QUESTION] Generating question {question_number} (deep {deep_question_number}) for child {child_id}")

        # Build exploration Q&A string
        exploration_str = ""
        for i, qa in enumerate(exploration_qa, 1):
            exploration_str += f"Q{i}: {qa['question']}\n"
            exploration_str += f"A{i}: {qa['answer']}\n\n"

        # Build previous deep context
        previous_deep_context = ""
        if previous_deep_qa:
            previous_deep_context = "PREVIOUS DEEP QUESTIONS AND ANSWERS:\n"
            for i, qa in enumerate(previous_deep_qa, 1):
                previous_deep_context += f"Deep Q{i}: {qa['question']}\n"
                previous_deep_context += f"Deep A{i}: {qa['answer']}\n\n"

        # Build the input message
        input_text = self.SYSTEM_PROMPT.format(
            question_number=question_number,
            deep_question_number=deep_question_number,
            child_id=child_id,
            child_age=child_age,
            initial_concern=initial_concern,
            exploration_qa=exploration_str if exploration_str else "No exploration answers yet.",
            previous_deep_context=previous_deep_context if previous_deep_context else "No previous deep questions yet."
        )

        # Run the agent
        result = await self.agent.ainvoke({"messages": [("human", input_text)]})

        # Extract the last message content
        last_message = result["messages"][-1]
        question = last_message.content if hasattr(last_message, 'content') else str(last_message)

        # Clean up the question (remove any tool call artifacts)
        question = question.strip()

        logger.info(f"[DEEP_QUESTION] Generated question: {question[:100]}...")

        return question


# Create singleton instance
deep_question_agent = DeepQuestionAgent()
