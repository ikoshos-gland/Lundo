"""Disclaimer templates for safety compliance."""
from enum import Enum
from typing import Dict


class DisclaimerType(Enum):
    """Types of disclaimers."""
    GENERAL = "general"
    MEDICAL = "medical"
    EMERGENCY = "emergency"
    DEVELOPMENTAL = "developmental"
    PROFESSIONAL_REFERRAL = "professional_referral"


DISCLAIMERS: Dict[DisclaimerType, str] = {
    DisclaimerType.GENERAL: """
**Important Disclaimer:**
This advice is for general informational and educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified health professionals with questions regarding your child's health or development.
""".strip(),

    DisclaimerType.MEDICAL: """
**Medical Disclaimer:**
The information provided is not medical advice and should not be used for diagnosing or treating health conditions. If your child is experiencing medical symptoms or you have concerns about medications, please consult a qualified healthcare provider immediately.

**When to seek professional help:**
- Persistent or worsening symptoms
- Concerns about medications or dosages
- Need for diagnosis or treatment plan
- Questions about your child's physical or mental health
""".strip(),

    DisclaimerType.EMERGENCY: """
🚨 **EMERGENCY NOTICE** 🚨

If your child is in immediate danger or experiencing a medical emergency:
- **Call 911** or your local emergency services immediately
- Contact your local crisis hotline
- Go to the nearest emergency room

**This system cannot provide emergency assistance.**

For non-emergency mental health support:
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- SAMHSA National Helpline: 1-800-662-4357
""".strip(),

    DisclaimerType.DEVELOPMENTAL: """
**Developmental Concerns Disclaimer:**
While I can provide general guidance about child development, significant developmental delays or concerns require professional evaluation.

**Please consult a pediatrician or developmental specialist if:**
- Your child is not meeting expected developmental milestones
- You notice regression in previously acquired skills
- You have concerns about your child's speech, motor skills, or social development
- Your child's behavior significantly impacts daily functioning

Early intervention can make a significant difference in developmental outcomes.
""".strip(),

    DisclaimerType.PROFESSIONAL_REFERRAL: """
**Professional Referral Recommended:**
Based on the nature of your concern, I strongly recommend consulting with:

- **Pediatrician**: For medical or physical health concerns
- **Child Psychologist/Psychiatrist**: For mental health or behavioral concerns
- **Developmental Specialist**: For developmental delays or autism screening
- **Licensed Therapist**: For ongoing behavioral therapy and support

These professionals can provide:
- Comprehensive evaluation and diagnosis
- Evidence-based treatment plans
- Ongoing monitoring and adjustment of interventions
- Coordination with other healthcare providers

**This system provides general guidance only** and cannot replace professional clinical evaluation.
""".strip(),
}


def get_disclaimer(disclaimer_type: DisclaimerType) -> str:
    """
    Get disclaimer text by type.

    Args:
        disclaimer_type: Type of disclaimer needed

    Returns:
        Disclaimer text
    """
    return DISCLAIMERS.get(disclaimer_type, DISCLAIMERS[DisclaimerType.GENERAL])


def get_disclaimers_for_flags(flags: list[str]) -> list[str]:
    """
    Get appropriate disclaimers based on detected safety flags.

    Args:
        flags: List of safety flags from trigger detection

    Returns:
        List of disclaimer texts to include
    """
    disclaimers = []

    # Always include general disclaimer
    disclaimers.append(get_disclaimer(DisclaimerType.GENERAL))

    # Add specific disclaimers based on flags
    if "emergency" in flags:
        disclaimers.append(get_disclaimer(DisclaimerType.EMERGENCY))

    if "harm" in flags:
        disclaimers.append(get_disclaimer(DisclaimerType.EMERGENCY))
        disclaimers.append(get_disclaimer(DisclaimerType.PROFESSIONAL_REFERRAL))

    if "medical_advice" in flags or "medical" in flags:
        disclaimers.append(get_disclaimer(DisclaimerType.MEDICAL))

    if "developmental_concern" in flags:
        disclaimers.append(get_disclaimer(DisclaimerType.DEVELOPMENTAL))

    # Add professional referral for high-severity cases
    if any(flag in flags for flag in ["medical_advice", "harm"]):
        if get_disclaimer(DisclaimerType.PROFESSIONAL_REFERRAL) not in disclaimers:
            disclaimers.append(get_disclaimer(DisclaimerType.PROFESSIONAL_REFERRAL))

    return disclaimers


def format_response_with_disclaimers(
    content: str,
    flags: list[str],
    prepend: bool = False
) -> str:
    """
    Format response with appropriate disclaimers.

    Args:
        content: Original response content
        flags: Safety flags from detection
        prepend: If True, add disclaimers before content; else after

    Returns:
        Formatted response with disclaimers
    """
    if not flags:
        return content

    disclaimers = get_disclaimers_for_flags(flags)
    disclaimer_text = "\n\n---\n\n".join(disclaimers)

    if prepend:
        return f"{disclaimer_text}\n\n---\n\n{content}"
    else:
        return f"{content}\n\n---\n\n{disclaimer_text}"


def get_human_review_prompt(
    response_content: str,
    detection_result: Dict
) -> str:
    """
    Generate human review prompt for interrupted workflows.

    Args:
        response_content: The AI-generated response
        detection_result: Safety detection results

    Returns:
        Formatted review prompt
    """
    level = detection_result["sensitivity_level"]
    flags = detection_result["flags"]
    matched_terms = detection_result["matched_terms"]
    recommendation = detection_result["recommendation"]

    prompt = f"""
# Human Review Required

**Sensitivity Level:** {level.upper()}
**Detected Issues:** {', '.join(flags)}
**Matched Terms:** {', '.join(matched_terms)}
**Recommendation:** {recommendation}

## AI-Generated Response:
{response_content}

## Review Actions:
1. **Approve**: Send response as-is (with disclaimers)
2. **Edit**: Modify response before sending
3. **Reject**: Do not send, escalate to professional

## Additional Disclaimers:
{chr(10).join(get_disclaimers_for_flags(flags))}

Please review and decide:
"""
    return prompt.strip()
