"""Simple Question Agent - Generates initial questions for knowledge gathering."""
import asyncio
import logging
from typing import Optional
from pydantic import BaseModel, Field
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.config import settings

logger = logging.getLogger(__name__)


class QuestionGenerationResult(BaseModel):
    """Structured output for question generation."""
    question_count: int = Field(
        description="Number of questions to ask (2-5)",
        ge=2,
        le=5
    )
    questions: list[str] = Field(
        description="List of simple, clear questions to ask the parent"
    )
    reasoning: str = Field(
        description="Brief explanation of why these questions were chosen"
    )


class SimpleQuestionAgent:
    """
    Phase 1 Knowledge Gathering Agent.

    Responsibilities:
    - Analyze the initial concern
    - Determine how many questions are needed (2-5)
    - Generate clear, simple questions to gather context
    - Questions are asked ONE-BY-ONE
    """

    SYSTEM_PROMPT = """You are a compassionate child behavioral therapist assistant gathering information
to better understand a parent's situation.

Given the parent's initial concern, you need to:
1. Determine how many questions (2-5) are needed to gather essential context
2. Generate those questions

Questions should be:
- Simple and clear
- Non-clinical in tone (avoid jargon)
- Focused on gathering practical information
- Open-ended to encourage detailed responses
- Empathetic and non-judgmental

Key areas to cover (as relevant):
- Duration: How long has this been happening?
- Frequency: How often does this occur?
- Triggers: What situations seem to cause this?
- Context: Where/when does this usually happen?
- Impact: How is this affecting the child/family?
- Previous attempts: What have you tried so far?
- Child's age and developmental stage if not provided

IMPORTANT:
- DO NOT ask too many questions - parents are stressed. Focus on essentials.
- If the child's age is not provided, make that your first question.
- Tailor questions to the specific concern mentioned.
- Be warm and supportive in tone.

You must respond with a JSON object containing:
- question_count: number of questions (2-5)
- questions: array of question strings
- reasoning: brief explanation"""

    def __init__(self):
        """Initialize the SimpleQuestionAgent with Azure OpenAI."""
        self.llm = AzureChatOpenAI(
            azure_deployment=settings.azure_openai_deployment,
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            timeout=60,  # Add 60 second timeout
            max_retries=2,  # Retry up to 2 times
        )
        # Use structured output for reliable parsing
        self.structured_llm = self.llm.with_structured_output(QuestionGenerationResult)

    async def generate_questions(
        self,
        initial_concern: str,
        child_age: Optional[int] = None
    ) -> dict:
        """
        Generate initial questions based on the parent's concern.

        Args:
            initial_concern: The parent's initial message/concern
            child_age: Child's age if known (None if not provided)

        Returns:
            dict with keys:
                - question_count: int
                - questions: list[str]
                - reasoning: str
        """
        logger.info(f"[SIMPLE_QUESTION_AGENT] Generating questions for concern: {initial_concern[:100]}...")
        logger.info(f"[SIMPLE_QUESTION_AGENT] Azure endpoint: {settings.azure_openai_endpoint}")
        logger.info(f"[SIMPLE_QUESTION_AGENT] Azure deployment: {settings.azure_openai_deployment}")

        # Build the user message with context
        user_content = f"""Parent's concern: "{initial_concern}"

Child's age: {f"{child_age} years old" if child_age else "Not provided (please ask)"}

Generate appropriate questions to better understand this situation."""

        messages = [
            SystemMessage(content=self.SYSTEM_PROMPT),
            HumanMessage(content=user_content)
        ]

        try:
            logger.info("[SIMPLE_QUESTION_AGENT] Calling LLM with structured output...")
            logger.info(f"[SIMPLE_QUESTION_AGENT] Message length: {len(str(messages))}")

            # Add explicit timeout wrapper
            result: QuestionGenerationResult = await asyncio.wait_for(
                self.structured_llm.ainvoke(messages),
                timeout=90.0  # 90 second timeout
            )

            logger.info(f"[SIMPLE_QUESTION_AGENT] LLM call completed successfully")
            logger.info(f"[SIMPLE_QUESTION_AGENT] Generated {result.question_count} questions")

            return {
                "question_count": result.question_count,
                "questions": result.questions,
                "reasoning": result.reasoning
            }

        except asyncio.TimeoutError:
            logger.error("[SIMPLE_QUESTION_AGENT] LLM call timed out after 90 seconds!")
            # Fallback to default questions
            return {
                "question_count": 3,
                "questions": [
                    "How long has this been happening?",
                    "How often does this occur?",
                    "Can you describe a typical situation when this occurs?"
                ],
                "reasoning": "Fallback questions due to LLM timeout"
            }

        except Exception as e:
            logger.error(f"[SIMPLE_QUESTION_AGENT] Error generating questions: {type(e).__name__}: {e}")
            # Fallback to default questions
            return {
                "question_count": 3,
                "questions": [
                    "How long has this been happening?",
                    "How often does this occur?",
                    "Can you describe a typical situation when this occurs?"
                ],
                "reasoning": f"Fallback questions due to error: {type(e).__name__}"
            }


# Singleton instance
simple_question_agent = SimpleQuestionAgent()
