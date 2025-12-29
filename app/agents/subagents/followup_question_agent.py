"""Follow-up Question Agent - Generates detailed follow-up questions."""
import logging
from typing import Optional
from pydantic import BaseModel, Field
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.config import settings

logger = logging.getLogger(__name__)


class FollowupGenerationResult(BaseModel):
    """Structured output for follow-up question generation."""
    question_count: int = Field(
        description="Number of follow-up questions (1-3)",
        ge=1,
        le=3
    )
    questions: list[str] = Field(
        description="List of targeted follow-up questions"
    )
    key_insights_so_far: str = Field(
        description="Summary of what we've learned from the initial questions"
    )
    areas_needing_clarification: list[str] = Field(
        description="Areas that need more detail or clarification"
    )


class FollowupQuestionAgent:
    """
    Phase 2 Knowledge Gathering Agent.

    Responsibilities:
    - Review answers from Phase 1
    - Identify gaps or areas needing more detail
    - Generate targeted follow-up questions (1-3)
    - Questions are asked ONE-BY-ONE
    """

    SYSTEM_PROMPT = """You are a compassionate child behavioral therapist assistant conducting a follow-up interview.

You have received initial answers from a parent about their child's behavioral concern. Now you need to:
1. Review what was shared and identify key insights
2. Identify areas that need clarification or more detail
3. Generate 1-3 targeted follow-up questions

Focus your follow-up questions on:
- Clarifying vague or incomplete answers
- Getting specific examples ("Can you give me an example of when this happened?")
- Understanding emotional impact on child and family
- Exploring potential triggers or patterns not yet covered
- Safety concerns if any signals were detected
- What the parent hopes to achieve (their goals)

IMPORTANT:
- Be empathetic - the parent is sharing difficult information
- Don't repeat questions that were already asked
- If the initial answers were comprehensive, you may need fewer follow-ups
- Focus on information that will help provide better guidance
- Look for red flags that need immediate attention (self-harm, abuse, severe distress)

You must respond with a JSON object containing:
- question_count: number of follow-up questions (1-3)
- questions: array of follow-up question strings
- key_insights_so_far: summary of what we've learned
- areas_needing_clarification: list of areas that need more detail"""

    def __init__(self):
        """Initialize the FollowupQuestionAgent with Azure OpenAI."""
        self.llm = AzureChatOpenAI(
            azure_deployment=settings.azure_openai_deployment,
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
        )
        # Use structured output for reliable parsing
        self.structured_llm = self.llm.with_structured_output(FollowupGenerationResult)

    async def generate_followups(
        self,
        phase_1_qa: list[dict],
        initial_concern: str,
        child_age: Optional[int] = None
    ) -> dict:
        """
        Generate follow-up questions based on Phase 1 answers.

        Args:
            phase_1_qa: List of {"question": str, "answer": str} from Phase 1
            initial_concern: The parent's original concern
            child_age: Child's age if known

        Returns:
            dict with keys:
                - question_count: int
                - questions: list[str]
                - key_insights_so_far: str
                - areas_needing_clarification: list[str]
        """
        logger.info(f"[FOLLOWUP_AGENT] Generating follow-ups based on {len(phase_1_qa)} Phase 1 answers")

        # Format the Phase 1 Q&A for the prompt
        qa_formatted = "\n".join([
            f"Q: {qa['question']}\nA: {qa['answer']}"
            for qa in phase_1_qa
        ])

        user_content = f"""Original concern: "{initial_concern}"

Child's age: {f"{child_age} years old" if child_age else "Not specified"}

Initial questions and answers:
{qa_formatted}

Based on this information, generate targeted follow-up questions to fill in any gaps and get a complete picture of the situation."""

        messages = [
            SystemMessage(content=self.SYSTEM_PROMPT),
            HumanMessage(content=user_content)
        ]

        try:
            result: FollowupGenerationResult = await self.structured_llm.ainvoke(messages)

            logger.info(f"[FOLLOWUP_AGENT] Generated {result.question_count} follow-up questions")
            logger.info(f"[FOLLOWUP_AGENT] Key insights: {result.key_insights_so_far[:100]}...")

            return {
                "question_count": result.question_count,
                "questions": result.questions,
                "key_insights_so_far": result.key_insights_so_far,
                "areas_needing_clarification": result.areas_needing_clarification
            }

        except Exception as e:
            logger.error(f"[FOLLOWUP_AGENT] Error generating follow-ups: {e}")
            # Fallback to default follow-up questions
            return {
                "question_count": 2,
                "questions": [
                    "Is there anything else you think is important for me to know?",
                    "What outcome are you hoping for? What would success look like for you?"
                ],
                "key_insights_so_far": "Review of initial answers incomplete due to error",
                "areas_needing_clarification": ["General context"]
            }


# Singleton instance
followup_question_agent = FollowupQuestionAgent()
