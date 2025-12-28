"""Exploration Agent - Initial context gathering through exploratory questions."""
import logging
from typing import Dict, Any, List

from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from app.config import settings

logger = logging.getLogger(__name__)


class ExplorationAgent:
    """
    Exploration Agent for initial context gathering.

    Asks 5 empathetic, open-ended questions to understand the parent's concern.
    Questions focus on: WHAT, WHEN, HOW LONG, WHO, IMPACT.

    This agent does not use tools - it purely generates questions based on
    the initial concern and previous answers.
    """

    SYSTEM_PROMPT = """You are an empathetic exploration guide for parents seeking help with child behavioral concerns.

Your role is to ask ONE thoughtful question at a time to understand the parent's situation better.
You are asking question {question_number} of 5 in the exploration phase.

IMPORTANT RULES:
1. Ask ONLY ONE question - do not include multiple questions
2. Questions should be open-ended and empathetic
3. Build on the previous answers when forming new questions
4. Show warmth and understanding - the parent is reaching out for help
5. Keep questions concise but caring

QUESTION FOCUS BY NUMBER:
- Question 1: WHAT is happening? (specific behavior description)
- Question 2: WHEN does this occur? (timing, triggers, situations)
- Question 3: HOW LONG has this been happening? (duration, pattern changes)
- Question 4: WHO else is involved or affected? (family dynamics, other caregivers)
- Question 5: WHAT IMPACT is this having? (on child, family, daily life)

CONTEXT:
- Child's age: {child_age} years old
- Parent's initial concern: {initial_concern}

{previous_context}

Generate a warm, supportive question that shows you care and want to understand their situation fully.
Just output the question directly - no preamble or explanation."""

    def __init__(self):
        """Initialize the exploration agent."""
        self.llm = AzureChatOpenAI(
            azure_deployment=settings.azure_openai_deployment,
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            temperature=0.7  # Slightly higher for more natural questions
        )

    async def generate_question(
        self,
        question_number: int,
        initial_concern: str,
        previous_qa: List[Dict[str, str]],
        child_age: int
    ) -> str:
        """
        Generate the next exploration question.

        Args:
            question_number: Which question (1-5)
            initial_concern: The parent's initial message/concern
            previous_qa: List of previous Q&A pairs [{"question": "...", "answer": "..."}]
            child_age: Child's age in years

        Returns:
            The next question to ask
        """
        logger.info(f"[EXPLORATION] Generating question {question_number} of 5")

        # Build previous context string
        previous_context = ""
        if previous_qa:
            previous_context = "PREVIOUS QUESTIONS AND ANSWERS:\n"
            for i, qa in enumerate(previous_qa, 1):
                previous_context += f"\nQ{i}: {qa['question']}\n"
                previous_context += f"A{i}: {qa['answer']}\n"

        # Create the prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", self.SYSTEM_PROMPT)
        ])

        # Format the prompt with variables
        formatted_prompt = prompt.format_messages(
            question_number=question_number,
            child_age=child_age,
            initial_concern=initial_concern,
            previous_context=previous_context if previous_context else "No previous questions yet."
        )

        # Generate the question
        response = await self.llm.ainvoke(formatted_prompt)
        question = response.content.strip()

        logger.info(f"[EXPLORATION] Generated question: {question[:100]}...")

        return question


# Create singleton instance
exploration_agent = ExplorationAgent()
