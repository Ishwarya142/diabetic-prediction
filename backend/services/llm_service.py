"""Claude Sonnet 4.5 (via Emergent Universal Key) — natural-language reports."""
import logging
import os
import uuid
from typing import Dict, List

from emergentintegrations.llm.chat import LlmChat, UserMessage

log = logging.getLogger(__name__)

DISCLAIMER = (
    "This is an AI-generated explanation. This is not medical advice. "
    "Always consult a qualified healthcare professional for diagnosis."
)

SYSTEM_PROMPT = (
    "You are a careful clinical-AI assistant that explains diabetes-risk model "
    "outputs to laypeople. You MUST: 1) Use plain, supportive language. "
    "2) Never diagnose, prescribe, or claim certainty. 3) Keep it under 180 words. "
    "4) Reference the most influential features in patient-friendly terms. "
    "5) End with a one-line, friendly suggestion to consult a clinician."
)


async def generate_report(
    prediction_label: str,
    probability: float,
    contributions: List[Dict],
) -> str:
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        log.warning("EMERGENT_LLM_KEY missing — returning fallback explanation")
        return _fallback(prediction_label, probability, contributions)

    top = contributions[:5]
    feat_lines = "\n".join(
        f"- {c['feature']} = {c['value']:.2f} (SHAP impact = {c['shap_value']:+.3f})"
        for c in top
    )
    user_text = (
        f"Model output: {prediction_label}.\n"
        f"Predicted probability of diabetes: {probability * 100:.1f}%.\n"
        f"Top contributing features (positive SHAP = pushes toward diabetes risk; "
        f"negative SHAP = pushes away):\n{feat_lines}\n\n"
        "Write a clear, empathetic explanation of what this output means and which "
        "features most influenced it. Avoid medical jargon."
    )

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"diab-{uuid.uuid4()}",
            system_message=SYSTEM_PROMPT,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        response = await chat.send_message(UserMessage(text=user_text))
        return str(response).strip()
    except Exception as exc:
        log.error("LLM call failed: %s", exc)
        return _fallback(prediction_label, probability, contributions)


def _fallback(label: str, probability: float, contributions: List[Dict]) -> str:
    top = contributions[:3]
    bullets = ", ".join(f"{c['feature']} ({c['value']:.1f})" for c in top)
    return (
        f"The model indicates: {label} (confidence ~{probability * 100:.0f}%). "
        f"The most influential factors were {bullets}. "
        "These results are statistical estimates only — please consult a healthcare "
        "professional for proper evaluation."
    )
