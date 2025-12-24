"""Content filtering and safety checks for responses."""
from typing import Dict, Any, Optional
from langgraph.types import interrupt

from app.safety.triggers import detect_sensitive_content, should_interrupt_for_review
from app.safety.disclaimers import (
    format_response_with_disclaimers,
    get_human_review_prompt
)


class ContentSafetyFilter:
    """
    Content safety filter for AI responses.

    Analyzes responses for sensitive content and handles:
    - Automatic disclaimer injection
    - Human-in-the-loop interrupts
    - Content moderation
    """

    def __init__(self, auto_add_disclaimers: bool = True):
        """
        Initialize content safety filter.

        Args:
            auto_add_disclaimers: Automatically add disclaimers to flagged content
        """
        self.auto_add_disclaimers = auto_add_disclaimers

    async def check_and_filter(
        self,
        content: str,
        user_message: str = "",
        enable_hitl: bool = True
    ) -> Dict[str, Any]:
        """
        Check content for safety issues and apply filtering.

        Args:
            content: AI-generated response content
            user_message: Original user message (for context)
            enable_hitl: Enable human-in-the-loop for sensitive content

        Returns:
            Dict with:
            - filtered_content: Modified content with disclaimers
            - safety_flags: List of triggered flags
            - requires_review: Boolean
            - was_interrupted: Boolean indicating if HITL was triggered
            - human_decision: Decision from human review (if interrupted)
        """
        # Detect sensitive content in both user message and AI response
        user_detection = detect_sensitive_content(user_message) if user_message else None
        response_detection = detect_sensitive_content(content)

        # Combine flags from both
        all_flags = []
        if user_detection:
            all_flags.extend(user_detection.get("flags", []))
        all_flags.extend(response_detection.get("flags", []))
        all_flags = list(set(all_flags))  # Remove duplicates

        # Determine if review is needed
        requires_review = response_detection["requires_review"]
        if user_detection:
            requires_review = requires_review or user_detection["requires_review"]

        # Check if we should interrupt
        should_interrupt_now = enable_hitl and requires_review

        filtered_content = content
        was_interrupted = False
        human_decision = None

        if should_interrupt_now:
            # Add disclaimers before review
            if self.auto_add_disclaimers:
                filtered_content = format_response_with_disclaimers(
                    content,
                    all_flags,
                    prepend=False  # Add disclaimers after content
                )

            # Generate human review prompt
            review_prompt = get_human_review_prompt(
                filtered_content,
                {
                    "sensitivity_level": response_detection["sensitivity_level"],
                    "flags": all_flags,
                    "matched_terms": response_detection["matched_terms"],
                    "recommendation": response_detection["recommendation"]
                }
            )

            # Interrupt for human review
            # The interrupt() function pauses execution and returns the value
            # passed to Command(resume=...) when the workflow is resumed
            human_decision = interrupt(review_prompt)

            was_interrupted = True

            # Process human decision
            filtered_content = self._process_human_decision(
                filtered_content,
                human_decision
            )

        elif self.auto_add_disclaimers and all_flags:
            # Add disclaimers without interrupting
            filtered_content = format_response_with_disclaimers(
                content,
                all_flags,
                prepend=False
            )

        return {
            "filtered_content": filtered_content,
            "safety_flags": all_flags,
            "requires_review": requires_review,
            "was_interrupted": was_interrupted,
            "human_decision": human_decision,
            "detection_details": {
                "user_detection": user_detection,
                "response_detection": response_detection
            }
        }

    def _process_human_decision(
        self,
        content: str,
        decision: Optional[Dict[str, Any]]
    ) -> str:
        """
        Process human review decision.

        Args:
            content: Original content
            decision: Human decision from interrupt resume

        Returns:
            Modified content based on decision
        """
        if not decision:
            return content

        decision_type = decision.get("type", "approve")

        if decision_type == "approve":
            # Use content as-is
            return content

        elif decision_type == "edit":
            # Use edited content from human
            return decision.get("edited_content", content)

        elif decision_type == "reject":
            # Replace with safe message
            return self._get_rejection_message(decision.get("reason", ""))

        return content

    def _get_rejection_message(self, reason: str = "") -> str:
        """
        Get message to send when response is rejected.

        Args:
            reason: Reason for rejection

        Returns:
            Safe response message
        """
        base_message = """
Thank you for your question. Based on the nature of your concern, I strongly recommend consulting with a qualified professional who can provide personalized guidance for your child's specific situation.

**Professional resources that may help:**
- **Pediatrician**: For medical or developmental concerns
- **Child Psychologist**: For behavioral or emotional concerns
- **Licensed Therapist**: For ongoing support and intervention strategies

If this is an emergency situation, please contact:
- **911** for immediate emergencies
- **988** for mental health crisis support
- Your local crisis hotline

I'm here to support you with general parenting guidance, but your child's wellbeing may benefit from professional clinical assessment.
""".strip()

        if reason:
            base_message = f"{base_message}\n\n**Review Note:** {reason}"

        return base_message


# Global instance
content_safety_filter = ContentSafetyFilter(auto_add_disclaimers=True)


async def filter_response(
    content: str,
    user_message: str = "",
    enable_hitl: bool = True
) -> Dict[str, Any]:
    """
    Convenience function to filter response content.

    Args:
        content: AI-generated content
        user_message: Original user message
        enable_hitl: Enable human-in-the-loop

    Returns:
        Filtered result
    """
    return await content_safety_filter.check_and_filter(
        content,
        user_message,
        enable_hitl
    )
