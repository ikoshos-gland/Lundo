"""Behaviorist skill - Operant conditioning, reinforcement, behavior modification."""
from app.agents.skills.base import PsychologicalSkill, SkillMetadata


class BehavioristSkill(PsychologicalSkill):
    """
    Behaviorist framework skill.

    Focuses on observable behaviors, reinforcement, consequences,
    and behavior modification techniques based on learning theory.
    """

    @property
    def metadata(self) -> SkillMetadata:
        return SkillMetadata(
            name="Behaviorist Approach",
            description="Address behaviors through reinforcement, consequences, and habit formation",
            applicable_ages=(2, 18),
            best_for=[
                "habit formation",
                "behavior modification",
                "tantrums",
                "compliance issues",
                "routines",
                "reward systems"
            ],
            keywords=[
                "behavior", "habit", "routine", "tantrum", "reward",
                "consequence", "punishment", "reinforcement", "discipline",
                "obedience", "compliance", "anger", "aggression",
                "chart", "sticker", "incentive", "consequence"
            ]
        )

    @property
    def framework_overview(self) -> str:
        return """
Behaviorism focuses on observable behaviors and how they are learned and
maintained through environmental consequences.

**Key Principles:**

1. **Operant Conditioning** (B.F. Skinner):
   - Behaviors followed by positive consequences increase
   - Behaviors followed by negative consequences decrease
   - Neutral responses lead to extinction

2. **Types of Reinforcement:**
   - Positive Reinforcement: Add something pleasant (praise, reward)
   - Negative Reinforcement: Remove something unpleasant (nagging stops)
   - Positive Punishment: Add something unpleasant (timeout, scolding)
   - Negative Punishment: Remove something pleasant (take away privilege)

3. **ABC Model:**
   - Antecedent: What happens before the behavior
   - Behavior: The observable action
   - Consequence: What happens after the behavior

4. **Shaping:** Reinforcing successive approximations toward desired behavior
"""

    @property
    def analysis_guidelines(self) -> str:
        return """
When analyzing behaviors through a behaviorist lens:

1. **Identify the ABC Pattern:**
   - What triggers the behavior? (Antecedent)
   - What exactly does the child do? (Behavior - be specific)
   - What happens afterward? (Consequence)

2. **Function of Behavior:**
   Every behavior serves a purpose:
   - Attention-seeking (positive or negative attention)
   - Escape/avoidance (getting out of something)
   - Sensory stimulation (feels good, releases energy)
   - Tangible reward (getting something wanted)

3. **Reinforcement Patterns:**
   - What is currently reinforcing the unwanted behavior?
   - Is negative attention still attention?
   - Are consequences immediate and consistent?
   - Is the reinforcement schedule appropriate?

4. **Environmental Factors:**
   - Can antecedents be modified to prevent behavior?
   - Are there competing behaviors to reinforce instead?
   - Is the environment set up for success?

5. **Consistency Check:**
   - Are parents consistent with consequences?
   - Do different caregivers apply same rules?
   - Are there mixed messages?
"""

    @property
    def intervention_strategies(self) -> str:
        return """
**Positive Reinforcement Strategies:**

1. **Specific Praise:**
   - "Great job putting your toys away!" (not just "good job")
   - Immediate and specific to behavior
   - Focus on effort, not just outcome

2. **Token Economy:**
   - Sticker charts for young children (ages 3-7)
   - Point systems for older children (ages 8+)
   - Exchange tokens for privileges/rewards
   - Make goals achievable (start small)

3. **Natural Consequences:**
   - Don't finish homework = lower grade (not parent punishment)
   - Forget coat = feel cold (within reason)
   - Allows learning from experience

**Reducing Unwanted Behaviors:**

1. **Planned Ignoring:**
   - Remove attention for attention-seeking behavior
   - Must be safe to ignore
   - Pair with reinforcement of opposite behavior
   - Expect "extinction burst" (gets worse before better)

2. **Time-Out (Ages 2-10):**
   - 1 minute per year of age (max 10 minutes)
   - Boring location, not scary
   - Immediately after behavior
   - Calm and neutral enforcement

3. **Logical Consequences:**
   - Directly related to misbehavior
   - "You threw the toy, so toy goes away for the day"
   - Not punitive, but teaching cause-effect

4. **Differential Reinforcement:**
   - Reinforce opposite behavior: If child whines → ignore
   - When child asks nicely → immediate positive response
   - Creates contrast in outcomes

**Behavior Modification Plans:**

1. **Target ONE behavior at a time**
2. **Define behavior specifically** ("hits sibling" not "is aggressive")
3. **Choose appropriate reinforcer** (must be motivating)
4. **Start with frequent reinforcement**, then fade to intermittent
5. **Track progress** (data helps adjust plan)
6. **Involve child in setting goals** (ages 6+)

**Important Guidelines:**
- Never use physical punishment
- Consequences should be immediate, brief, and related
- Focus 80% on reinforcing good behavior, 20% on consequences
- Be consistent - inconsistency teaches persistence in misbehavior
- Celebrate small improvements (shaping)
"""


# Create singleton instance
behaviorist_skill = BehavioristSkill()
