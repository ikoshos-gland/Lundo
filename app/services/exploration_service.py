"""Exploration service for managing the exploration questioning phase."""
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple, Union, AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.conversation import Conversation
from app.models.exploration_qa import ExplorationQA
from app.models.child import Child
from app.models.message import Message
from app.agents.subagents.exploration_agent import exploration_agent
from app.agents.subagents.deep_question_agent import deep_question_agent
from app.agents.subagents.topic_detector import topic_detector
from app.schemas.exploration import (
    ExplorationPhase,
    QuestionAnswer,
    ExplorationStatus,
    QuestionResponse,
    ExplorationCompleteResponse
)

logger = logging.getLogger(__name__)


class ExplorationService:
    """
    Service for managing the exploration questioning phase.

    Handles:
    - Starting exploration for new topics
    - Generating questions (exploration and deep)
    - Processing answers
    - Tracking phase progress
    - Topic detection for existing conversations
    """

    async def get_exploration_status(
        self,
        db: AsyncSession,
        conversation_id: int
    ) -> ExplorationStatus:
        """
        Get current exploration phase status.

        Args:
            db: Database session
            conversation_id: Conversation ID

        Returns:
            ExplorationStatus with current phase and Q&A history
        """
        # Get conversation
        result = await db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        # Get Q&A for current topic
        topic_id = conversation.current_exploration_topic_id
        exploration_qa = []
        deep_qa = []
        current_question = None
        current_question_number = 0
        initial_concern = None

        if topic_id:
            result = await db.execute(
                select(ExplorationQA)
                .where(ExplorationQA.conversation_id == conversation_id)
                .where(ExplorationQA.topic_id == topic_id)
                .order_by(ExplorationQA.question_number)
            )
            qa_records = result.scalars().all()

            for qa in qa_records:
                qa_item = QuestionAnswer(
                    question=qa.question,
                    answer=qa.answer,
                    question_type=qa.question_type,
                    question_number=qa.question_number,
                    asked_at=qa.asked_at,
                    answered_at=qa.answered_at
                )

                if qa.question_type == "exploration":
                    exploration_qa.append(qa_item)
                else:
                    deep_qa.append(qa_item)

                # Track current question (unanswered)
                if qa.answer is None:
                    current_question = qa.question
                    current_question_number = qa.question_number

            # Get initial concern from first exploration Q&A metadata or conversation
            if qa_records:
                # Find the initial concern from the first question's context
                initial_concern = conversation.summary  # We'll store it here

        return ExplorationStatus(
            phase=ExplorationPhase(conversation.exploration_phase),
            current_question_number=current_question_number,
            current_question=current_question,
            exploration_qa=exploration_qa,
            deep_qa=deep_qa,
            initial_concern=initial_concern,
            topic_id=topic_id
        )

    async def start_exploration(
        self,
        db: AsyncSession,
        conversation_id: int,
        child_id: int,
        initial_concern: str
    ) -> QuestionResponse:
        """
        Initialize exploration phase and return first question.

        Args:
            db: Database session
            conversation_id: Conversation ID
            child_id: Child ID
            initial_concern: The parent's initial concern message

        Returns:
            QuestionResponse with the first exploration question
        """
        logger.info(f"[EXPLORATION] Starting exploration for conversation {conversation_id}")

        # Get conversation
        result = await db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        # Get child info
        result = await db.execute(
            select(Child).where(Child.id == child_id)
        )
        child = result.scalar_one_or_none()

        if not child:
            raise ValueError(f"Child {child_id} not found")

        # Generate topic ID
        topic_id = f"topic_{uuid.uuid4().hex[:12]}"

        # Update conversation state
        conversation.exploration_phase = ExplorationPhase.EXPLORATION_QUESTIONS.value
        conversation.current_exploration_topic_id = topic_id
        conversation.summary = initial_concern  # Store for later reference

        # Generate first question
        question = await exploration_agent.generate_question(
            question_number=1,
            initial_concern=initial_concern,
            previous_qa=[],
            child_age=child.age_years
        )

        # Save question to database
        qa_record = ExplorationQA(
            conversation_id=conversation_id,
            topic_id=topic_id,
            question_type="exploration",
            question_number=1,
            question=question,
            asked_at=datetime.utcnow()
        )
        db.add(qa_record)
        await db.commit()

        logger.info(f"[EXPLORATION] First question generated for topic {topic_id}")

        return QuestionResponse(
            question=question,
            question_number=1,
            question_type="exploration",
            phase=ExplorationPhase.EXPLORATION_QUESTIONS,
            is_last_question=False,
            topic_id=topic_id
        )

    async def submit_answer(
        self,
        db: AsyncSession,
        conversation_id: int,
        answer: str
    ) -> Union[QuestionResponse, ExplorationCompleteResponse]:
        """
        Process answer and return next question or completion status.

        Args:
            db: Database session
            conversation_id: Conversation ID
            answer: User's answer to current question

        Returns:
            QuestionResponse if more questions, ExplorationCompleteResponse if done
        """
        logger.info(f"[EXPLORATION] Processing answer for conversation {conversation_id}")

        # Get conversation
        result = await db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        topic_id = conversation.current_exploration_topic_id
        if not topic_id:
            raise ValueError("No active exploration topic")

        # Get child info
        result = await db.execute(
            select(Child).where(Child.id == conversation.child_id)
        )
        child = result.scalar_one_or_none()

        # Find current unanswered question
        result = await db.execute(
            select(ExplorationQA)
            .where(ExplorationQA.conversation_id == conversation_id)
            .where(ExplorationQA.topic_id == topic_id)
            .where(ExplorationQA.answer.is_(None))
            .order_by(ExplorationQA.question_number)
            .limit(1)
        )
        current_qa = result.scalar_one_or_none()

        if not current_qa:
            raise ValueError("No pending question to answer")

        # Save the answer
        current_qa.answer = answer
        current_qa.answered_at = datetime.utcnow()

        current_question_number = current_qa.question_number

        # Determine next step
        if current_question_number < 5:
            # More exploration questions
            next_question_number = current_question_number + 1

            # Get previous Q&A for context
            previous_qa = await self._get_qa_list(
                db, conversation_id, topic_id, "exploration"
            )

            # Generate next exploration question
            question = await exploration_agent.generate_question(
                question_number=next_question_number,
                initial_concern=conversation.summary,
                previous_qa=previous_qa,
                child_age=child.age_years
            )

            # Save new question
            new_qa = ExplorationQA(
                conversation_id=conversation_id,
                topic_id=topic_id,
                question_type="exploration",
                question_number=next_question_number,
                question=question,
                asked_at=datetime.utcnow()
            )
            db.add(new_qa)
            await db.commit()

            return QuestionResponse(
                question=question,
                question_number=next_question_number,
                question_type="exploration",
                phase=ExplorationPhase.EXPLORATION_QUESTIONS,
                is_last_question=False,
                topic_id=topic_id
            )

        elif current_question_number == 5:
            # Transition to deep questions phase
            conversation.exploration_phase = ExplorationPhase.DEEP_QUESTIONS.value

            # Get exploration answers for deep question context
            exploration_qa = await self._get_qa_list(
                db, conversation_id, topic_id, "exploration"
            )

            # Generate first deep question
            question = await deep_question_agent.generate_question(
                question_number=6,
                child_id=child.id,
                child_age=child.age_years,
                initial_concern=conversation.summary,
                exploration_qa=exploration_qa,
                previous_deep_qa=[]
            )

            # Save new question
            new_qa = ExplorationQA(
                conversation_id=conversation_id,
                topic_id=topic_id,
                question_type="deep",
                question_number=6,
                question=question,
                asked_at=datetime.utcnow()
            )
            db.add(new_qa)
            await db.commit()

            return QuestionResponse(
                question=question,
                question_number=6,
                question_type="deep",
                phase=ExplorationPhase.DEEP_QUESTIONS,
                is_last_question=False,
                topic_id=topic_id
            )

        elif current_question_number < 10:
            # More deep questions
            next_question_number = current_question_number + 1

            # Get context
            exploration_qa = await self._get_qa_list(
                db, conversation_id, topic_id, "exploration"
            )
            previous_deep_qa = await self._get_qa_list(
                db, conversation_id, topic_id, "deep"
            )

            # Generate next deep question
            question = await deep_question_agent.generate_question(
                question_number=next_question_number,
                child_id=child.id,
                child_age=child.age_years,
                initial_concern=conversation.summary,
                exploration_qa=exploration_qa,
                previous_deep_qa=previous_deep_qa
            )

            # Save new question
            new_qa = ExplorationQA(
                conversation_id=conversation_id,
                topic_id=topic_id,
                question_type="deep",
                question_number=next_question_number,
                question=question,
                asked_at=datetime.utcnow()
            )
            db.add(new_qa)
            await db.commit()

            return QuestionResponse(
                question=question,
                question_number=next_question_number,
                question_type="deep",
                phase=ExplorationPhase.DEEP_QUESTIONS,
                is_last_question=(next_question_number == 10),
                topic_id=topic_id
            )

        else:
            # Exploration complete (question 10 answered)
            conversation.exploration_phase = ExplorationPhase.COMPLETED.value
            await db.commit()

            # Get all Q&A for response
            exploration_qa = await self._get_qa_list(
                db, conversation_id, topic_id, "exploration", as_schema=True
            )
            deep_qa = await self._get_qa_list(
                db, conversation_id, topic_id, "deep", as_schema=True
            )

            logger.info(f"[EXPLORATION] Exploration complete for topic {topic_id}")

            return ExplorationCompleteResponse(
                exploration_qa=exploration_qa,
                deep_qa=deep_qa,
                initial_concern=conversation.summary,
                topic_id=topic_id
            )

    async def should_trigger_exploration(
        self,
        db: AsyncSession,
        conversation_id: int,
        message: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if message should trigger exploration.

        Args:
            db: Database session
            conversation_id: Conversation ID
            message: User's message

        Returns:
            Tuple of (should_trigger, topic_summary)
        """
        # Get conversation
        result = await db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()

        if not conversation:
            return False, None

        # If already in exploration, don't trigger again
        if conversation.exploration_phase in [
            ExplorationPhase.EXPLORATION_QUESTIONS.value,
            ExplorationPhase.DEEP_QUESTIONS.value
        ]:
            return False, None

        # Get recent messages for context
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.id.desc())
            .limit(6)
        )
        recent_messages = result.scalars().all()

        # Convert to format expected by topic detector
        messages_list = [
            {"role": msg.role, "content": msg.content}
            for msg in reversed(recent_messages)
        ]

        # Detect if new topic
        detection = await topic_detector.detect(
            current_message=message,
            recent_messages=messages_list,
            current_topic_summary=conversation.summary
        )

        # Only trigger if confidence is high enough
        if detection.is_new_topic and detection.confidence >= 0.7:
            logger.info(
                f"[EXPLORATION] New topic detected: {detection.topic_summary} "
                f"(confidence: {detection.confidence})"
            )
            return True, detection.topic_summary

        return False, None

    async def _get_qa_list(
        self,
        db: AsyncSession,
        conversation_id: int,
        topic_id: str,
        question_type: str,
        as_schema: bool = False
    ) -> List:
        """Get Q&A list for a topic and type."""
        result = await db.execute(
            select(ExplorationQA)
            .where(ExplorationQA.conversation_id == conversation_id)
            .where(ExplorationQA.topic_id == topic_id)
            .where(ExplorationQA.question_type == question_type)
            .where(ExplorationQA.answer.isnot(None))
            .order_by(ExplorationQA.question_number)
        )
        records = result.scalars().all()

        if as_schema:
            return [
                QuestionAnswer(
                    question=r.question,
                    answer=r.answer,
                    question_type=r.question_type,
                    question_number=r.question_number,
                    asked_at=r.asked_at,
                    answered_at=r.answered_at
                )
                for r in records
            ]
        else:
            return [
                {"question": r.question, "answer": r.answer}
                for r in records
            ]

    async def get_exploration_context_for_workflow(
        self,
        db: AsyncSession,
        conversation_id: int
    ) -> Dict[str, Any]:
        """
        Get exploration Q&A context to enrich the main workflow.

        Args:
            db: Database session
            conversation_id: Conversation ID

        Returns:
            Dictionary with exploration_qa and deep_qa lists
        """
        result = await db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()

        if not conversation or not conversation.current_exploration_topic_id:
            return {"exploration_qa": [], "deep_qa": [], "initial_concern": ""}

        topic_id = conversation.current_exploration_topic_id

        exploration_qa = await self._get_qa_list(
            db, conversation_id, topic_id, "exploration"
        )
        deep_qa = await self._get_qa_list(
            db, conversation_id, topic_id, "deep"
        )

        return {
            "exploration_qa": exploration_qa,
            "deep_qa": deep_qa,
            "initial_concern": conversation.summary or ""
        }


# Global service instance
exploration_service = ExplorationService()
