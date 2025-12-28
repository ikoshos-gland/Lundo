"""Topic Detector - Detects new topics that warrant exploration phase."""
import logging
from typing import Dict, Any, List, Optional

from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.config import settings

logger = logging.getLogger(__name__)


class TopicDetectionResult(BaseModel):
    """Structured output for topic detection."""
    is_new_topic: bool = Field(
        description="Whether this message introduces a new behavioral concern"
    )
    topic_summary: str = Field(
        description="Brief summary of the topic (2-5 words)"
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Confidence in the determination (0.0 to 1.0)"
    )
    reasoning: str = Field(
        description="Brief explanation for the determination"
    )


class TopicDetector:
    """
    Detects new topics that warrant exploration phase.

    Uses a combination of:
    - Keyword heuristics for explicit new-topic indicators
    - LLM classification for ambiguous cases
    """

    DETECTION_PROMPT = """Analyze whether this message introduces a NEW behavioral concern
or is a continuation of the existing conversation topic.

CONVERSATION HISTORY (recent messages):
{conversation_history}

CURRENT TOPIC BEING DISCUSSED:
{current_topic}

NEW MESSAGE TO ANALYZE:
{current_message}

INDICATORS OF A NEW TOPIC:
- Different child behavior than discussed before
- New concern introduced with phrases like "also", "another thing", "different issue"
- Shift from one behavioral domain to another (e.g., sleep -> eating -> social)
- Explicit introduction of new problem
- Unrelated to previous therapeutic discussion

NOT A NEW TOPIC (these are continuations):
- Follow-up questions about current topic
- Clarifications or additional details about the same concern
- Responses to therapist questions
- Simple acknowledgments or thank yous
- Asking for more advice on same topic
- Providing requested information

Determine if this is a new topic that requires a fresh exploration phase."""

    # Explicit indicators that suggest a new topic
    NEW_TOPIC_INDICATORS = [
        "another thing",
        "different issue",
        "also wanted to ask",
        "separate concern",
        "unrelated but",
        "different topic",
        "new problem",
        "something else",
        "on a different note",
        "changing subject",
        "while we're at it",
        "also struggling with",
        "another concern",
        "besides that",
        "apart from that"
    ]

    def __init__(self):
        """Initialize the topic detector."""
        self.llm = AzureChatOpenAI(
            azure_deployment=settings.azure_openai_deployment,
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            temperature=0  # Deterministic for classification
        ).with_structured_output(TopicDetectionResult)

    async def detect(
        self,
        current_message: str,
        recent_messages: List[Dict[str, str]],
        current_topic_summary: Optional[str] = None
    ) -> TopicDetectionResult:
        """
        Detect if message introduces a new topic.

        Args:
            current_message: The new user message to analyze
            recent_messages: Recent conversation messages [{"role": "...", "content": "..."}]
            current_topic_summary: Summary of the current topic being discussed

        Returns:
            TopicDetectionResult with detection outcome
        """
        logger.info(f"[TOPIC_DETECTOR] Analyzing message: {current_message[:100]}...")

        # New conversation always triggers exploration
        if len(recent_messages) == 0:
            logger.info("[TOPIC_DETECTOR] New conversation - triggering exploration")
            return TopicDetectionResult(
                is_new_topic=True,
                topic_summary=self._extract_topic_summary(current_message),
                confidence=1.0,
                reasoning="New conversation - no previous context"
            )

        # Check for explicit indicators first (fast path)
        message_lower = current_message.lower()
        for indicator in self.NEW_TOPIC_INDICATORS:
            if indicator in message_lower:
                logger.info(f"[TOPIC_DETECTOR] Explicit indicator found: '{indicator}'")
                return TopicDetectionResult(
                    is_new_topic=True,
                    topic_summary=self._extract_topic_summary(current_message),
                    confidence=0.9,
                    reasoning=f"Explicit indicator: '{indicator}'"
                )

        # Use LLM for ambiguous cases
        return await self._llm_detect(
            current_message,
            recent_messages,
            current_topic_summary
        )

    async def _llm_detect(
        self,
        current_message: str,
        recent_messages: List[Dict[str, str]],
        current_topic_summary: Optional[str]
    ) -> TopicDetectionResult:
        """Use LLM to detect new topic."""
        # Build conversation history string
        history_str = ""
        for msg in recent_messages[-6:]:  # Last 6 messages for context
            role = "Parent" if msg.get("role") == "user" else "Therapist"
            content = msg.get("content", "")[:200]  # Truncate long messages
            history_str += f"{role}: {content}\n"

        # Create prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", self.DETECTION_PROMPT)
        ])

        formatted = prompt.format_messages(
            conversation_history=history_str if history_str else "No previous messages.",
            current_topic=current_topic_summary or "Not yet determined.",
            current_message=current_message
        )

        # Get structured output
        result = await self.llm.ainvoke(formatted)

        logger.info(
            f"[TOPIC_DETECTOR] LLM result: is_new_topic={result.is_new_topic}, "
            f"confidence={result.confidence}, reasoning={result.reasoning}"
        )

        return result

    def _extract_topic_summary(self, message: str) -> str:
        """Extract a brief topic summary from the message."""
        # Simple extraction - first sentence or first N words
        first_sentence = message.split('.')[0].strip()
        words = first_sentence.split()

        if len(words) <= 5:
            return first_sentence
        else:
            return ' '.join(words[:5]) + "..."


# Create singleton instance
topic_detector = TopicDetector()
