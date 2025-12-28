"""Sensitive topic detection for child behavioral therapist system."""
import re
from typing import List, Dict, Any, Tuple
from enum import Enum


class SensitivityLevel(Enum):
    """Sensitivity levels for content."""
    SAFE = "safe"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class SafetyTrigger:
    """
    Detects sensitive topics that require human review.

    Categories:
    - Medical/Clinical: Diagnoses, medications, disorders
    - Harm: Abuse, self-harm, violence
    - Critical: Emergency situations
    - Developmental: Serious developmental concerns
    """

    # Medical and clinical keywords
    MEDICAL_KEYWORDS = [
        r"\b(adhd|add|autism|asd|asperger)\b",
        r"\b(depression|anxiety|ptsd|ocd)\b",
        r"\b(bipolar|schizophrenia|psychosis)\b",
        r"\b(disorder|syndrome|diagnosis)\b",
        r"\b(medication|prescri(be|ption)|pill|drug)\b",
        r"\b(therapist|psychiatrist|psychologist|doctor)\b",
    ]

    # Harm and abuse keywords
    HARM_KEYWORDS = [
        r"\b(abuse|abusive|abused)\b",
        r"\b(hit|hitting|beat|beating|hurt|hurting)\b",
        r"\b(self[- ]harm|cutting|suicide|kill)\b",
        r"\b(neglect|neglected|abandoned)\b",
        r"\b(violence|violent|aggress(ion|ive))\b",
        r"\b(trauma|traumatic|traumatized)\b",
    ]

    # Emergency keywords
    EMERGENCY_KEYWORDS = [
        r"\b(emergency|urgent|immediate|crisis)\b",
        r"\b(danger|dangerous|unsafe)\b",
        r"\b(hospital|911|emergency room|er)\b",
        r"\b(suicide|suicidal|kill (myself|himself|herself))\b",
    ]

    # Serious developmental concerns
    DEVELOPMENTAL_KEYWORDS = [
        r"\b(not (talking|speaking|walking))\b",
        r"\b(severe(ly)? delay(ed)?)\b",
        r"\b(regress(ion|ing|ed))\b",
        r"\b(stop(ped)? (eating|drinking|sleeping))\b",
    ]

    # Medical advice keywords
    MEDICAL_ADVICE_KEYWORDS = [
        r"\b(should (i|we) (give|take|use))\b",
        r"\b(how much|dosage|dose)\b",
        r"\b(stop (taking|using)|start (taking|using))\b",
        r"\b(safe to (give|take|use))\b",
    ]

    def __init__(self):
        """Initialize safety trigger detector."""
        self._compile_patterns()

    def _compile_patterns(self):
        """Compile regex patterns for efficiency."""
        self.medical_patterns = [re.compile(p, re.IGNORECASE) for p in self.MEDICAL_KEYWORDS]
        self.harm_patterns = [re.compile(p, re.IGNORECASE) for p in self.HARM_KEYWORDS]
        self.emergency_patterns = [re.compile(p, re.IGNORECASE) for p in self.EMERGENCY_KEYWORDS]
        self.developmental_patterns = [re.compile(p, re.IGNORECASE) for p in self.DEVELOPMENTAL_KEYWORDS]
        self.medical_advice_patterns = [re.compile(p, re.IGNORECASE) for p in self.MEDICAL_ADVICE_KEYWORDS]

    def detect_sensitive_content(self, text: str) -> Dict[str, Any]:
        """
        Detect sensitive content in text.

        Args:
            text: Text to analyze

        Returns:
            Detection results with:
            - sensitivity_level: SAFE, MODERATE, HIGH, CRITICAL
            - requires_review: Boolean
            - flags: List of triggered categories
            - matched_terms: List of matched keywords
            - recommendation: Action recommendation
        """
        flags = []
        matched_terms = []

        # Check emergency (highest priority)
        emergency_matches = self._check_patterns(text, self.emergency_patterns)
        if emergency_matches:
            flags.append("emergency")
            matched_terms.extend(emergency_matches)

        # Check harm
        harm_matches = self._check_patterns(text, self.harm_patterns)
        if harm_matches:
            flags.append("harm")
            matched_terms.extend(harm_matches)

        # Check medical advice
        medical_advice_matches = self._check_patterns(text, self.medical_advice_patterns)
        if medical_advice_matches:
            flags.append("medical_advice")
            matched_terms.extend(medical_advice_matches)

        # Check medical/clinical
        medical_matches = self._check_patterns(text, self.medical_patterns)
        if medical_matches:
            flags.append("medical")
            matched_terms.extend(medical_matches)

        # Check developmental concerns
        developmental_matches = self._check_patterns(text, self.developmental_patterns)
        if developmental_matches:
            flags.append("developmental_concern")
            matched_terms.extend(developmental_matches)

        # Determine sensitivity level and action
        sensitivity_level, requires_review, recommendation = self._assess_severity(flags)

        return {
            "sensitivity_level": sensitivity_level.value,
            "requires_review": requires_review,
            "flags": flags,
            "matched_terms": list(set(matched_terms)),  # Remove duplicates
            "recommendation": recommendation
        }

    def _check_patterns(self, text: str, patterns: List[re.Pattern]) -> List[str]:
        """
        Check text against list of regex patterns.

        Args:
            text: Text to check
            patterns: Compiled regex patterns

        Returns:
            List of matched terms
        """
        matches = []
        for pattern in patterns:
            found = pattern.findall(text)
            matches.extend(found)
        return matches

    def _assess_severity(self, flags: List[str]) -> Tuple[SensitivityLevel, bool, str]:
        """
        Assess severity based on triggered flags.

        Args:
            flags: List of triggered flag categories

        Returns:
            Tuple of (sensitivity_level, requires_review, recommendation)
        """
        if not flags:
            return (
                SensitivityLevel.SAFE,
                False,
                "proceed_normally"
            )

        # CRITICAL: Emergency or harm detected
        if "emergency" in flags or "harm" in flags:
            return (
                SensitivityLevel.CRITICAL,
                True,
                "escalate_immediately"
            )

        # HIGH: Medical advice or serious developmental concerns
        if "medical_advice" in flags or (
            "developmental_concern" in flags and "medical" in flags
        ):
            return (
                SensitivityLevel.HIGH,
                True,
                "require_professional_consultation"
            )

        # MODERATE: Medical mentions or developmental concerns
        if "medical" in flags or "developmental_concern" in flags:
            return (
                SensitivityLevel.MODERATE,
                True,
                "add_disclaimer_and_review"
            )

        # Default to moderate if any flags present
        return (
            SensitivityLevel.MODERATE,
            True,
            "add_disclaimer_and_review"
        )

    def should_interrupt(self, detection_result: Dict[str, Any]) -> bool:
        """
        Determine if workflow should be interrupted for human review.

        Args:
            detection_result: Result from detect_sensitive_content()

        Returns:
            True if interrupt required
        """
        return detection_result["requires_review"]

    def get_interrupt_message(self, detection_result: Dict[str, Any]) -> str:
        """
        Generate interrupt message for human reviewer.

        Args:
            detection_result: Result from detect_sensitive_content()

        Returns:
            Human-readable message
        """
        level = detection_result["sensitivity_level"]
        flags = detection_result["flags"]
        recommendation = detection_result["recommendation"]

        messages = {
            "critical": "⚠️ CRITICAL: Emergency or harm-related content detected. Immediate expert review required.",
            "high": "⚠️ HIGH SENSITIVITY: Medical advice or serious concern detected. Professional consultation recommended.",
            "moderate": "⚠️ MODERATE: Sensitive topic detected. Review and add appropriate disclaimers.",
        }

        message = messages.get(level, "Content requires review.")
        message += f"\n\nDetected categories: {', '.join(flags)}"
        message += f"\nRecommendation: {recommendation}"

        return message


# Singleton instance
safety_trigger_detector = SafetyTrigger()


def detect_sensitive_content(text: str) -> Dict[str, Any]:
    """
    Convenience function to detect sensitive content.

    Args:
        text: Text to analyze

    Returns:
        Detection results
    """
    return safety_trigger_detector.detect_sensitive_content(text)


def should_interrupt_for_review(text: str) -> Tuple[bool, Dict[str, Any]]:
    """
    Check if text requires human review.

    Args:
        text: Text to check

    Returns:
        Tuple of (should_interrupt, detection_result)
    """
    result = detect_sensitive_content(text)
    should_interrupt = safety_trigger_detector.should_interrupt(result)
    return should_interrupt, result
