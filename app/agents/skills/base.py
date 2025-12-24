"""Base skill class for psychological framework skills."""
from abc import ABC, abstractmethod
from typing import Dict, Any
from pydantic import BaseModel, Field


class SkillMetadata(BaseModel):
    """Metadata for a psychological framework skill."""

    name: str = Field(description="Skill name")
    description: str = Field(description="Brief description of when to use this skill")
    applicable_ages: tuple[int, int] = Field(
        description="Age range in years (min, max)"
    )
    best_for: list[str] = Field(
        description="Types of issues this framework works best for"
    )
    keywords: list[str] = Field(
        description="Keywords that suggest this skill should be loaded"
    )


class PsychologicalSkill(ABC):
    """
    Base class for psychological framework skills.

    Each skill represents a different theoretical perspective
    (e.g., Developmental Psychology, Behaviorist, Play Therapy).

    Uses progressive disclosure: Skills are loaded on-demand when relevant,
    preventing context window overflow.
    """

    @property
    @abstractmethod
    def metadata(self) -> SkillMetadata:
        """Return skill metadata for discovery."""
        pass

    @property
    @abstractmethod
    def framework_overview(self) -> str:
        """
        Return theoretical framework overview.

        This is loaded when the skill is activated.
        """
        pass

    @property
    @abstractmethod
    def analysis_guidelines(self) -> str:
        """
        Return guidelines for analyzing behaviors through this lens.

        Includes:
        - Key concepts to consider
        - Questions to ask
        - Patterns to look for
        """
        pass

    @property
    @abstractmethod
    def intervention_strategies(self) -> str:
        """
        Return intervention strategies specific to this framework.

        Includes:
        - Recommended approaches
        - Age-appropriate techniques
        - Expected outcomes
        """
        pass

    def get_full_content(self) -> str:
        """
        Get complete skill content for loading into agent context.

        Returns:
            Formatted string with all skill information
        """
        return f"""
# {self.metadata.name}

## Framework Overview
{self.framework_overview}

## Analysis Guidelines
{self.analysis_guidelines}

## Intervention Strategies
{self.intervention_strategies}

---
Applicable Ages: {self.metadata.applicable_ages[0]}-{self.metadata.applicable_ages[1]} years
Best For: {', '.join(self.metadata.best_for)}
"""

    def is_applicable(
        self,
        child_age: int,
        issue_keywords: list[str]
    ) -> tuple[bool, float]:
        """
        Determine if this skill is applicable to the current situation.

        Args:
            child_age: Child's age in years
            issue_keywords: Keywords describing the current issue

        Returns:
            Tuple of (is_applicable, relevance_score)
        """
        # Check age range
        min_age, max_age = self.metadata.applicable_ages
        if not (min_age <= child_age <= max_age):
            return False, 0.0

        # Calculate relevance score based on keyword matches
        skill_keywords = set(k.lower() for k in self.metadata.keywords)
        issue_keywords_set = set(k.lower() for k in issue_keywords)

        matches = skill_keywords.intersection(issue_keywords_set)
        relevance_score = len(matches) / len(skill_keywords) if skill_keywords else 0.0

        # Also check if issue matches "best_for" categories
        best_for_set = set(b.lower() for b in self.metadata.best_for)
        best_for_matches = best_for_set.intersection(issue_keywords_set)
        if best_for_matches:
            relevance_score += 0.3  # Boost for direct category match

        relevance_score = min(relevance_score, 1.0)  # Cap at 1.0

        is_applicable = relevance_score > 0.2  # Threshold for applicability

        return is_applicable, relevance_score
