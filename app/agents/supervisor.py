"""Supervisor Agent - Main orchestrator for the therapist system."""
from typing import Dict, Any, Optional, List, AsyncGenerator
from datetime import datetime
from pydantic import BaseModel, Field

from langchain_openai import AzureChatOpenAI

from app.workflow.graph import run_therapist_workflow, run_therapist_workflow_streaming
from app.memory.schemas import ChildMemory, add_behavioral_pattern, add_timeline_event
from app.config import settings


# Structured output schema for LLM-based memory extraction
class ExtractedLifeEvent(BaseModel):
    """A significant life event mentioned in conversation."""
    event: str = Field(description="Brief description of the life event")
    category: str = Field(
        description="Category: 'death', 'divorce', 'moving', 'new_sibling', 'medical', 'school_change', 'other'"
    )
    impact: str = Field(description="Potential emotional/behavioral impact on the child")


class ExtractedBehavior(BaseModel):
    """A specific behavior mentioned in conversation."""
    behavior: str = Field(description="The specific behavior described")
    triggers: List[str] = Field(default_factory=list, description="What triggers this behavior")
    context: str = Field(description="When/where this behavior occurs")


class ExtractedFamilyContext(BaseModel):
    """Family context information."""
    context_type: str = Field(description="Type: 'family_structure', 'relationship', 'living_situation', 'other'")
    details: str = Field(description="Details of the family context")


class ExtractedMemory(BaseModel):
    """Complete extracted memory from a conversation."""
    life_events: List[ExtractedLifeEvent] = Field(
        default_factory=list,
        description="Significant life events mentioned (death, divorce, moving, etc.)"
    )
    behaviors: List[ExtractedBehavior] = Field(
        default_factory=list,
        description="Specific behaviors the parent is concerned about"
    )
    family_context: List[ExtractedFamilyContext] = Field(
        default_factory=list,
        description="Relevant family context (single parent, siblings, etc.)"
    )
    emotional_triggers: List[str] = Field(
        default_factory=list,
        description="Emotional triggers identified"
    )
    should_remember: bool = Field(
        default=False,
        description="True if there's important information worth storing for future sessions"
    )


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
        # Use singleton to avoid multiple connections/setup calls
        from app.memory.backends import get_memory_backends
        self.memory_backends = get_memory_backends()

        # LLM for memory extraction (using structured output)
        # Note: Some models don't support temperature=0, so we use default (1)
        self.extraction_llm = AzureChatOpenAI(
            azure_deployment=settings.azure_openai_deployment,
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version
        ).with_structured_output(ExtractedMemory)

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

        # Debug: log final_state keys and final_response
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"[SUPERVISOR] final_state keys: {list(final_state.keys())}")
        logger.info(f"[SUPERVISOR] final_response value: {final_state.get('final_response')[:100] if final_state.get('final_response') else 'NONE'}")

        # Update long-term memory if needed
        await self._update_memory_from_conversation(
            child_id=child_id,
            concern=final_state.get("current_concern", ""),
            behavior_analysis=final_state.get("behavior_analysis", ""),
            child_age=child_age
        )

        # Extract response (use 'or' to handle None values, not just missing keys)
        response = final_state.get("final_response") or "I apologize, I encountered an error."

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

    async def process_message_stream(
        self,
        child_id: int,
        child_age: int,
        parent_id: int,
        conversation_id: int,
        thread_id: str,
        user_message: str,
        is_first_message: bool = False,
        last_report_topic: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Process a parent's message with streaming response.

        Runs the analysis workflow first (non-streaming), then streams
        the synthesis response token by token.

        Args:
            child_id: Child's database ID
            child_age: Child's age in years
            parent_id: Parent's database ID
            conversation_id: Conversation database ID
            thread_id: LangGraph thread ID
            user_message: Parent's message
            is_first_message: Whether this is the first message in conversation
            last_report_topic: Topic of last full report (for topic change detection)

        Yields:
            Dictionary with event type and content:
            - {"type": "analysis_complete"}: Analysis phase done
            - {"type": "token", "content": "..."}: Response token
            - {"type": "done", "metadata": {...}}: Stream complete
            - {"type": "interrupt", "data": {...}}: Knowledge gathering question
        """
        import logging
        logger = logging.getLogger(__name__)

        # Run the streaming workflow
        full_response = ""
        async for event in run_therapist_workflow_streaming(
            child_id=child_id,
            child_age=child_age,
            parent_id=parent_id,
            conversation_id=conversation_id,
            thread_id=thread_id,
            user_message=user_message,
            is_first_message=is_first_message,
            last_report_topic=last_report_topic
        ):
            event_type = event.get("type")

            if event_type == "analysis_complete":
                # Notify that analysis is done, synthesis starting
                yield {"type": "analysis_complete"}

            elif event_type == "token":
                # Stream token
                token = event.get("content", "")
                full_response += token
                yield {"type": "token", "content": token}

            elif event_type == "interrupt":
                # Knowledge gathering question - forward to client
                interrupt_data = event.get("data", {})
                logger.info(f"[SUPERVISOR] Interrupt received: {interrupt_data.get('question', '')[:50]}...")
                yield {"type": "interrupt", "data": interrupt_data}
                return  # Stop processing, client will call resume endpoint

            elif event_type == "done":
                # Get final state for metadata
                final_state = event.get("state", {})

                # Update long-term memory if needed
                await self._update_memory_from_conversation(
                    child_id=child_id,
                    concern=final_state.get("current_concern", ""),
                    behavior_analysis=final_state.get("behavior_analysis", ""),
                    child_age=child_age
                )

                yield {
                    "type": "done",
                    "metadata": {
                        "requires_human_review": final_state.get("requires_human_review", False),
                        "safety_flags": final_state.get("safety_flags", []),
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
        Update child's long-term memory based on conversation using LLM extraction.

        Args:
            child_id: Child's ID
            concern: Current concern discussed
            behavior_analysis: Analysis from behavior analyst
            child_age: Child's age
        """
        import logging
        logger = logging.getLogger(__name__)

        # Extract important information using LLM
        extracted = await self._extract_memory_with_llm(concern, behavior_analysis)

        # Only proceed if there's something worth remembering
        if not extracted.should_remember:
            logger.debug(f"[MEMORY] No significant information to store for child {child_id}")
            return

        logger.info(f"[MEMORY] Extracting memories for child {child_id}: "
                   f"{len(extracted.life_events)} life events, "
                   f"{len(extracted.behaviors)} behaviors, "
                   f"{len(extracted.family_context)} family context items")

        # Get existing memory or create new
        memory_data = await self.memory_backends.get_long_term_memory(
            child_id=child_id,
            memory_type="behavioral_patterns",
            key="main"
        )

        if memory_data:
            child_memory = ChildMemory.from_dict(memory_data)
        else:
            child_memory = ChildMemory(child_id=child_id)

        # Store life events as timeline events
        for life_event in extracted.life_events:
            # Map extracted category to schema category
            category_mapping = {
                "death": "life_change",
                "divorce": "life_change",
                "moving": "life_change",
                "new_sibling": "life_change",
                "medical": "medical",
                "school_change": "life_change",
                "other": "other"
            }
            category = category_mapping.get(life_event.category, "other")

            child_memory = add_timeline_event(
                memory=child_memory,
                event=life_event.event,
                category=category,
                impact=life_event.impact,
                behavioral_changes=[]
            )
            logger.info(f"[MEMORY] Added life event: {life_event.event}")

        # Store behavioral patterns
        for behavior in extracted.behaviors:
            child_memory = add_behavioral_pattern(
                memory=child_memory,
                behavior=behavior.behavior,
                context=behavior.context,
                frequency="observed_once",
                triggers=behavior.triggers,
                severity="mild"
            )
            logger.info(f"[MEMORY] Added behavior: {behavior.behavior}")

        # Store family context as a separate memory type
        if extracted.family_context:
            family_data = {
                "child_id": child_id,
                "contexts": [
                    {"type": ctx.context_type, "details": ctx.details}
                    for ctx in extracted.family_context
                ],
                "last_updated": datetime.now().isoformat()
            }
            await self.memory_backends.save_long_term_memory(
                child_id=child_id,
                memory_type="family_context",
                key="main",
                data=family_data
            )
            logger.info(f"[MEMORY] Saved family context: {len(extracted.family_context)} items")

        # Store emotional triggers
        if extracted.emotional_triggers:
            triggers_data = await self.memory_backends.get_long_term_memory(
                child_id=child_id,
                memory_type="triggers_and_responses",
                key="emotional_triggers"
            ) or {"triggers": []}

            # Add new triggers (avoid duplicates)
            existing_triggers = set(triggers_data.get("triggers", []))
            new_triggers = [t for t in extracted.emotional_triggers if t not in existing_triggers]
            triggers_data["triggers"] = list(existing_triggers) + new_triggers
            triggers_data["last_updated"] = datetime.now().isoformat()

            await self.memory_backends.save_long_term_memory(
                child_id=child_id,
                memory_type="triggers_and_responses",
                key="emotional_triggers",
                data=triggers_data
            )
            logger.info(f"[MEMORY] Added {len(new_triggers)} emotional triggers")

        # Save updated main memory
        await self.memory_backends.save_long_term_memory(
            child_id=child_id,
            memory_type="behavioral_patterns",
            key="main",
            data=child_memory.to_dict()
        )

    async def _extract_memory_with_llm(self, concern: str, behavior_analysis: str) -> ExtractedMemory:
        """
        Extract important information from conversation using LLM.

        Uses structured output to reliably extract:
        - Life events (death, divorce, moving, etc.)
        - Behavioral patterns
        - Family context
        - Emotional triggers

        Args:
            concern: Parent's message/concern
            behavior_analysis: Analysis from behavior analyst

        Returns:
            ExtractedMemory with structured information
        """
        extraction_prompt = f"""Analyze this parent's message and extract important information to remember for future sessions.

PARENT'S MESSAGE:
{concern}

BEHAVIOR ANALYSIS:
{behavior_analysis if behavior_analysis else "Not available"}

Extract:
1. LIFE EVENTS: Any significant events mentioned (death in family, divorce, moving, new sibling, medical issues, school changes)
2. BEHAVIORS: Specific child behaviors the parent is concerned about
3. FAMILY CONTEXT: Family structure info (single parent, siblings, living situation)
4. EMOTIONAL TRIGGERS: What triggers emotional responses in the child

Set should_remember=True if ANY of the following are mentioned:
- Death or loss in the family
- Divorce or separation
- Major life changes
- Trauma or abuse
- Medical conditions
- Important family context

Be thorough but concise. Only extract information that would be valuable for a therapist to remember."""

        try:
            extracted = await self.extraction_llm.ainvoke(extraction_prompt)
            return extracted
        except Exception as e:
            # Log error and return empty extraction
            import logging
            logging.getLogger(__name__).error(f"Memory extraction failed: {e}")
            return ExtractedMemory()

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
