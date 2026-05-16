"""
AI-powered quiz generation from PPT/study material content.
Uses Google Gemma 3 (via Gemini API) to generate accurate MCQ questions.
No hardcoded NLP heuristics — fully AI-driven.
"""

import os
import json
import random
import logging

logger = logging.getLogger(__name__)

# Model to use — Gemma 4 31B instruction-tuned (via Gemini API)
_QUIZ_MODEL = "gemma-4-31b-it"


def generate_quiz(content_text: str, subject_name: str, num_questions: int = 10) -> list[dict] | None:
    """
    Generate MCQ quiz questions from study material using Gemma AI.

    Args:
        content_text: Concatenated text from PPT slides / study materials.
        subject_name: Name of the subject for context.
        num_questions: How many questions to generate (default 10).

    Returns:
        List of question dicts, or None if generation fails.
        Each dict: { question, options: [str x4], correct_index: int, explanation: str }
    """
    if not content_text or len(content_text.strip()) < 50:
        logger.error("Not enough content to generate quiz questions")
        return None

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        logger.error("GEMINI_API_KEY not set — quiz generation unavailable")
        return None

    try:
        from google import genai

        client = genai.Client(api_key=api_key)

        # Truncate to avoid excessive token usage (~6000 chars ≈ ~1500 tokens)
        truncated = content_text[:6000]
        if len(content_text) > 6000:
            truncated += "\n... [content truncated]"

        prompt = f"""You are an expert quiz maker. Generate exactly {num_questions} multiple choice questions from the study material below about "{subject_name}".

Study Material:
{truncated}

Return ONLY a valid JSON array — no markdown, no code fences, no explanation before or after.
Each question must follow this exact structure:
[
  {{
    "question": "A clear, specific question based on the content?",
    "options": ["Correct answer", "Wrong option 1", "Wrong option 2", "Wrong option 3"],
    "correct_index": 0,
    "explanation": "Brief reason why this is correct."
  }}
]

Rules:
- Questions must be directly based on the provided content only
- Each question must have exactly 4 options
- correct_index is 0-3 (the index of the correct option in the options array)
- Shuffle the correct answer position — don't always put it at index 0
- Wrong options must be plausible but clearly incorrect
- No math formulas, symbols, or single-word options
- Mix question types: factual recall, conceptual understanding, application
- Keep questions concise and unambiguous"""

        response = client.models.generate_content(
            model=_QUIZ_MODEL,
            contents=prompt,
        )

        text = response.text.strip()

        # Strip markdown code fences if the model adds them
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:])  # remove first line (```json or ```)
            if text.rstrip().endswith("```"):
                text = text.rstrip()[:-3].strip()

        data = json.loads(text)

        if not isinstance(data, list) or len(data) == 0:
            logger.warning(f"Gemma returned empty or non-list response for '{subject_name}'")
            return None

        # Validate and sanitise each question
        valid = []
        for q in data:
            if (
                isinstance(q, dict)
                and isinstance(q.get("question"), str)
                and len(q["question"].strip()) > 10
                and isinstance(q.get("options"), list)
                and len(q["options"]) == 4
                and all(isinstance(o, str) and len(o.strip()) > 0 for o in q["options"])
                and isinstance(q.get("correct_index"), int)
                and 0 <= q["correct_index"] <= 3
            ):
                valid.append({
                    "question": q["question"].strip(),
                    "options": [str(o).strip() for o in q["options"]],
                    "correct_index": q["correct_index"],
                    "explanation": str(q.get("explanation", "")).strip(),
                })

        if not valid:
            logger.warning(f"Gemma quiz had no valid questions after validation for '{subject_name}'")
            return None

        random.shuffle(valid)
        logger.info(f"Gemma generated {len(valid)} quiz questions for '{subject_name}'")
        return valid[:num_questions]

    except json.JSONDecodeError as e:
        logger.error(f"Gemma returned invalid JSON for quiz: {e}")
        return None
    except Exception as e:
        logger.error(f"Gemma quiz generation failed ({type(e).__name__}): {e}")
        return None
