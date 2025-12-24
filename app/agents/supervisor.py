"""Supervisor Agent - Main orchestrator for the therapist system."""
from typing import Dict, Any, Optional
from datetime import datetime

from app.workflow.graph import run_therapist_workflow
from app.memory.backends import MemoryBackends
from app.memory.schemas import ChildMemory, add_behavioral_pattern, add_timeline_event
from app.config import settings


class SupervisorAgent:
    """
    Supervisor Agent - Orchestrates the entire therapist system.

    Responsibilities:
    - Coordinate workflow execution
    - Manage conversation state
    - Update long-term memories
    - Handle human-in-the-loop escalations
    - Provide unified interface for API
    """

    def __init__(self):
        """Initialize the supervisor agent."""
        self.memory_backends = MemoryBackends(settings.database_url)

    async def process_message(
        self,
        child_id: int,
        child_age: int,
        parent_id: int,
        conversation_id: int,
        thread_id: str,
        user_message: str
    ) -> Dict[str, Any]:
        """
        Process a parent's message through the complete workflow.

        Args:
            child_id: Child's database ID
            child_age: Child's age in years
            parent_id: Parent's database ID
            conversation_id: Conversation database ID
            thread_id: LangGraph thread ID
            user_message: Parent's message

        Returns:
            Dictionary with:
                - response: AI response to parent
                - requires_human_review: Whether human review is needed
                - safety_flags: List of safety concerns
                - metadata: Additional workflow metadata
        """
        # Run the workflow
        final_state = await run_therapist_workflow(
            child_id=child_id,
            child_age=child_age,
            parent_id=parent_id,
            conversation_id=conversation_id,
            thread_id=thread_id,
            user_message=user_message
        )

        # Update long-term memory if needed
        await self._update_memory_from_conversation(
            child_id=child_id,
            concern=final_state.get("current_concern", ""),
            behavior_analysis=final_state.get("behavior_analysis", ""),
            child_age=child_age
        )

        # Extract response
        response = final_state.get("final_response", "I apologize, I encountered an error.")

        return {
            "response": response,
            "requires_human_review": final_state.get("requires_human_review", False),
            "safety_flags": final_state.get("safety_flags", []),
            "metadata": {
                "agents_called": final_state.get("agents_to_call", []),
                "skills_used": final_state.get("active_skills", []),
                "parent_emotional_state": final_state.get("parent_emotional_state"),
                "timestamp": datetime.now().isoformat()
            }
        }

    async def _update_memory_from_conversation(
        self,
        child_id: int,
        concern: str,
        behavior_analysis: str,
        child_age: int
    ) -> None:
        """
        Update child's long-term memory based on conversation.

        Args:
            child_id: Child's ID
            concern: Current concern discussed
            behavior_analysis: Analysis from behavior analyst
            child_age: Child's age
        """
        # Get existing memory or create new
        memory_data = await self.memory_backends.get_long_term_memory(
            child_id=child_id,
            memory_type="behavioral_patterns"
        )

        if memory_data:
            child_memory = ChildMemory.from_dict(memory_data)
        else:
            child_memory = ChildMemory(child_id=child_id)

        # Simple keyword extraction for behavioral patterns
        # In production, use NLP for better extraction
        behavior_keywords = self._extract_behavior_keywords(concern)

        if behavior_keywords:
            # Add new behavioral pattern
            child_memory = add_behavioral_pattern(
                memory=child_memory,
                behavior=behavior_keywords.get("behavior", concern[:100]),
                context=concern[:200],
                frequency="observed_once",  # Update with actual tracking
                triggers=behavior_keywords.get("triggers", []),
                severity="mild"  # Default, should be analyzed
            )

        # Add timeline event for significant discussions
        if len(concern) > 50:  # Only for substantial concerns
            child_memory = add_timeline_event(
                memory=child_memory,
                event=f"Parent discussed: {concern[:100]}",
                category="challenge",
                impact="Seeking guidance",
                behavioral_changes=[]
            )

        # Save updated memory
        await self.memory_backends.save_long_term_memory(
            child_id=child_id,
            memory_type="behavioral_patterns",
            data=child_memory.to_dict()
        )

    def _extract_behavior_keywords(self, text: str) -> Dict[str, Any]:
        """
        Extract behavior-related keywords from text.

        This is a simple implementation. In production, use NLP or LLM.

        Args:
            text: Text to analyze

        Returns:
            Dictionary with extracted information
        """
        # Common behavioral keywords
        behavior_verbs = [
            "hitting", "biting", "screaming", "crying", "refusing",
            "tantrum", "yelling", "throwing", "breaking", "pushing"
        ]

        trigger_words = [
            "when", "after", "before", "during", "because"
        ]

        text_lower = text.lower()

        # Find behaviors
        behaviors = [verb for verb in behavior_verbs if verb in text_lower]

        # Find potential triggers (simple heuristic)
        triggers = []
        for trigger_word in trigger_words:
            if trigger_word in text_lower:
                # Extract context around trigger word
                idx = text_lower.find(trigger_word)
                context = text[max(0, idx-20):min(len(text), idx+50)]
                triggers.append(context.strip())

        return {
            "behavior": behaviors[0] if behaviors else None,
            "triggers": triggers[:3]  # Limit to 3 triggers
        }

    async def get_conversation_summary(
        self,
        thread_id: str
    ) -> Optional[str]:
        """
        Get a summary of the conversation so far.

        Args:
            thread_id: LangGraph thread ID

        Returns:
            Conversation summary or None
        """
        # TODO: Implement using checkpointer.aget to retrieve state
        # For now, return None
        return None

    async def close(self):
        """Close all connections."""
        await self.memory_backends.close()


# Global supervisor instance
supervisor = SupervisorAgent()
