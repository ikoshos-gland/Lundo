"""Developmental Psychology skill - Piaget, Erikson, developmental stages."""
from app.agents.skills.base import PsychologicalSkill, SkillMetadata


class DevelopmentalPsychologySkill(PsychologicalSkill):
    """
    Developmental Psychology framework skill.

    Focuses on age-appropriate behaviors, developmental stages,
    and understanding behaviors through Piaget's cognitive development
    and Erikson's psychosocial stages.
    """

    @property
    def metadata(self) -> SkillMetadata:
        return SkillMetadata(
            name="Developmental Psychology",
            description="Understand behaviors through developmental stages and age-appropriate expectations",
            applicable_ages=(0, 18),
            best_for=[
                "age-appropriate behavior questions",
                "developmental milestones",
                "regression concerns",
                "transition difficulties",
                "cognitive development"
            ],
            keywords=[
                "age", "developmental", "stage", "milestone", "growth",
                "transition", "regression", "maturity", "normal", "typical",
                "appropriate", "expected", "piaget", "erikson", "egocentric"
            ]
        )

    @property
    def framework_overview(self) -> str:
        return """
Developmental Psychology examines how children grow and change across physical,
cognitive, social, and emotional domains. Key theorists:

**Piaget's Cognitive Development Stages:**
1. Sensorimotor (0-2 years): Learning through senses and actions
2. Preoperational (2-7 years): Symbolic thinking, egocentrism, magical thinking
3. Concrete Operational (7-11 years): Logical thinking about concrete events
4. Formal Operational (12+ years): Abstract reasoning

**Erikson's Psychosocial Stages:**
1. Trust vs. Mistrust (0-18 months)
2. Autonomy vs. Shame (18 months-3 years)
3. Initiative vs. Guilt (3-5 years)
4. Industry vs. Inferiority (6-11 years)
5. Identity vs. Role Confusion (12-18 years)

This framework helps determine if behaviors are developmentally appropriate
and guides age-specific interventions.
"""

    @property
    def analysis_guidelines(self) -> str:
        return """
When analyzing behaviors through a developmental lens:

1. **Determine Developmental Stage:**
   - What is the child's age and expected stage?
   - Are they showing age-appropriate behaviors?
   - Any signs of regression or precocious development?

2. **Context of Egocentrism (Ages 2-7):**
   - Difficulty sharing is normal in preoperational stage
   - Child may struggle to see others' perspectives
   - "Mine!" is developmentally expected, not necessarily selfish

3. **Transitions Between Stages:**
   - Starting school (Initiative vs. Guilt)
   - Puberty (Identity formation)
   - These transitions can cause temporary behavioral changes

4. **Red Flags vs. Normal Variation:**
   - Significant delays across multiple domains
   - Persistent regression after stress resolves
   - Behaviors significantly out of sync with peers

5. **Consider Environmental Factors:**
   - Recent life changes (new sibling, move, divorce)
   - Trauma or significant stress
   - Cultural and family expectations
"""

    @property
    def intervention_strategies(self) -> str:
        return """
**Age 0-2 (Sensorimotor):**
- Provide consistent, responsive caregiving
- Rich sensory experiences
- Secure attachment building
- Simple cause-effect play

**Age 2-7 (Preoperational):**
- Use concrete examples and visual aids
- Allow for magical thinking without reinforcing
- Teach sharing gradually, don't expect immediate success
- Provide choices to build autonomy
- Use play to work through emotions
- Keep explanations simple and direct

**Age 7-11 (Concrete Operational):**
- Logical consequences for behavior
- Teach problem-solving with concrete scenarios
- Build competence through achievable challenges
- Peer relationships become important
- Can understand rules and fairness

**Age 12-18 (Formal Operational):**
- Support identity exploration
- Allow appropriate independence
- Discuss abstract concepts (values, future)
- Validate emotions while setting boundaries
- Peer influence is strong - focus on healthy friendships

**General Developmental Approach:**
- Normalize age-appropriate behaviors for parents
- Set realistic expectations based on stage
- Provide scaffolding for next developmental level
- Celebrate achievements and milestones
- Be patient with temporary regressions during transitions
"""


# Create singleton instance
developmental_psychology_skill = DevelopmentalPsychologySkill()
