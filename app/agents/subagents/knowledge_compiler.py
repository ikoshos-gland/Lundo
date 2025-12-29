"""Knowledge Compiler - Compiles gathered Q&A into structured context."""
import logging
from typing import Optional
from pydantic import BaseModel, Field
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from app.config import settings

logger = logging.getLogger(__name__)


class ChildDetails(BaseModel):
    """Structured information about the child."""
    age: Optional[int] = Field(default=None, description="Child's age")
    developmental_stage: Optional[str] = Field(default=None, description="Developmental stage description")
    relevant_history: Optional[str] = Field(default=None, description="Any relevant history mentioned")


class SituationContext(BaseModel):
    """Context about the behavioral situation."""
    duration: Optional[str] = Field(default=None, description="How long the issue has been occurring")
    frequency: Optional[str] = Field(default=None, description="How often the behavior occurs")
    triggers: list[str] = Field(default_factory=list, description="Known or suspected triggers")
    settings: list[str] = Field(default_factory=list, description="Where/when the behavior occurs")
    previous_attempts: Optional[str] = Field(default=None, description="What has been tried before")


class CompiledKnowledge(BaseModel):
    """Structured output from knowledge compilation."""
    initial_concern: str = Field(description="The parent's original concern, refined")
    child_details: ChildDetails = Field(description="Information about the child")
    situation_context: SituationContext = Field(description="Context about the situation")
    severity_indicators: list[str] = Field(
        default_factory=list,
        description="Any indicators of severity or urgency"
    )
    parent_goals: str = Field(default="", description="What the parent hopes to achieve")
    key_insights: str = Field(description="Summary of key insights for the therapy team")
    recommended_focus_areas: list[str] = Field(
        default_factory=list,
        description="Areas the main analysis should focus on"
    )


class KnowledgeCompiler:
    """
    Compiles all gathered Q&A into structured knowledge for the main workflow.

    Responsibilities:
    - Synthesize all Q&A into actionable context
    - Extract key information structured for each subagent
    - Identify severity and urgency indicators
    - Prepare context for behavior_analyst, psychological_perspective, material_consultant
    """

    SYSTEM_PROMPT = """You are a clinical data analyst for a child behavioral therapy team.

Your job is to take the raw interview data from a parent and compile it into structured, actionable information that will help the therapy team provide better guidance.

From the parent's responses, extract and organize:

1. CHILD DETAILS
   - Age and developmental considerations
   - Any relevant history or context about the child

2. SITUATION CONTEXT
   - Duration: How long has this been happening?
   - Frequency: How often does it occur?
   - Triggers: What situations seem to cause this?
   - Settings: Where/when does this typically happen?
   - Previous attempts: What has been tried before?

3. SEVERITY INDICATORS
   - Look for any red flags or urgent concerns
   - Note if professional intervention may be needed
   - Identify any safety concerns

4. PARENT GOALS
   - What outcome is the parent hoping for?
   - What does success look like to them?

5. KEY INSIGHTS
   - Summarize the most important information
   - Connect patterns if you see them

6. RECOMMENDED FOCUS AREAS
   - What should the therapy team focus on?
   - What frameworks or approaches might be most helpful?

Be thorough but concise. Focus on extracting actionable information."""

    def __init__(self):
        """Initialize the KnowledgeCompiler with Azure OpenAI."""
        self.llm = AzureChatOpenAI(
            azure_deployment=settings.azure_openai_deployment,
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
        )
        # Use structured output for reliable parsing
        self.structured_llm = self.llm.with_structured_output(CompiledKnowledge)

    async def compile(
        self,
        phase_1_qa: list[dict],
        phase_2_qa: list[dict],
        initial_concern: str,
        child_age: Optional[int] = None
    ) -> dict:
        """
        Compile all gathered information into structured knowledge.

        Args:
            phase_1_qa: List of {"question": str, "answer": str} from Phase 1
            phase_2_qa: List of {"question": str, "answer": str} from Phase 2
            initial_concern: The parent's original concern
            child_age: Child's age if known from profile

        Returns:
            dict with structured knowledge for the main workflow
        """
        logger.info("[KNOWLEDGE_COMPILER] Compiling gathered knowledge...")

        # Format all Q&A
        all_qa = phase_1_qa + phase_2_qa
        qa_formatted = "\n".join([
            f"Q: {qa['question']}\nA: {qa['answer']}"
            for qa in all_qa
        ])

        user_content = f"""Parent's initial concern: "{initial_concern}"

Child's age from profile: {f"{child_age} years old" if child_age else "Not in profile"}

Complete interview transcript:
{qa_formatted}

Please compile this information into a structured format that will help our therapy team provide the best guidance."""

        messages = [
            SystemMessage(content=self.SYSTEM_PROMPT),
            HumanMessage(content=user_content)
        ]

        try:
            result: CompiledKnowledge = await self.structured_llm.ainvoke(messages)

            logger.info(f"[KNOWLEDGE_COMPILER] Compiled knowledge with {len(result.severity_indicators)} severity indicators")
            logger.info(f"[KNOWLEDGE_COMPILER] Focus areas: {result.recommended_focus_areas}")

            # Convert to dict for state storage
            compiled = {
                "initial_concern": result.initial_concern,
                "child_details": {
                    "age": result.child_details.age,
                    "developmental_stage": result.child_details.developmental_stage,
                    "relevant_history": result.child_details.relevant_history
                },
                "situation_context": {
                    "duration": result.situation_context.duration,
                    "frequency": result.situation_context.frequency,
                    "triggers": result.situation_context.triggers,
                    "settings": result.situation_context.settings,
                    "previous_attempts": result.situation_context.previous_attempts
                },
                "severity_indicators": result.severity_indicators,
                "parent_goals": result.parent_goals,
                "key_insights": result.key_insights,
                "recommended_focus_areas": result.recommended_focus_areas,
                "raw_qa": all_qa  # Keep raw Q&A for reference
            }

            return compiled

        except Exception as e:
            logger.error(f"[KNOWLEDGE_COMPILER] Error compiling knowledge: {e}")
            # Return basic structure with raw data
            return {
                "initial_concern": initial_concern,
                "child_details": {"age": child_age},
                "situation_context": {},
                "severity_indicators": [],
                "parent_goals": "",
                "key_insights": "Compilation error - using raw interview data",
                "recommended_focus_areas": [],
                "raw_qa": all_qa
            }


# Singleton instance
knowledge_compiler = KnowledgeCompiler()
