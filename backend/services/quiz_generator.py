"""
Local quiz generation from PPT/study material content.
Generates MCQ questions using NLTK for sentence tokenization and
POS-tag-based key-phrase extraction, plus regex for definition detection.
"""

import re
import random
import logging

import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.tag import pos_tag

logger = logging.getLogger(__name__)

# Ensure required NLTK data is present (downloads silently on first run)
for _resource, _path in [
    ('punkt_tab', 'tokenizers/punkt_tab'),
    ('averaged_perceptron_tagger_eng', 'taggers/averaged_perceptron_tagger_eng'),
]:
    try:
        nltk.data.find(_path)
    except LookupError:
        nltk.download(_resource, quiet=True)


# Words that look like proper nouns but are useless as quiz terms
_STOPWORDS = {
    'this', 'that', 'these', 'those', 'there', 'their', 'then',
    'also', 'which', 'where', 'when', 'thus', 'hence', 'note',
    'positive', 'negative', 'true', 'false', 'figure', 'fig',
    'example', 'above', 'below', 'given', 'let', 'case',
}

# Characters that indicate a math/formula fragment
_MATH_CHARS = set('=+*/\\<>{}[]|^~_$@')


def _is_valid_term(text: str) -> bool:
    """Return True only if text is a clean, readable quiz term/option."""
    text = text.strip()
    # Too short
    if len(text) < 3:
        return False
    # Contains math/formula characters or digits
    if any(c in _MATH_CHARS for c in text):
        return False
    if any(c.isdigit() for c in text):
        return False
    # Single generic word in stopword list
    if text.lower() in _STOPWORDS:
        return False
    # Must contain at least one letter
    if not any(c.isalpha() for c in text):
        return False
    return True


def _clean_text(text: str) -> str:
    """Normalize whitespace and remove junk from slide text."""
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\x20-\x7E\n]', '', text)  # ASCII printable only
    return text.strip()


def _extract_sentences(text: str) -> list[str]:
    """Split text into meaningful sentences using NLTK sent_tokenize."""
    text = _clean_text(text)
    # nltk.sent_tokenize handles abbreviations (Dr., Fig., etc.) correctly
    raw = sent_tokenize(text)
    return [s.strip() for s in raw if 8 <= len(s.split()) <= 40]


def _extract_key_definitions(text: str) -> list[tuple[str, str]]:
    """
    Find definition-style patterns like:
    - "X is Y"
    - "X refers to Y"
    - "X is defined as Y"
    Returns list of (term, definition) tuples.
    """
    patterns = [
        r'([A-Z][a-zA-Z\s]{2,30})\s+(?:is|are|refers to|is defined as|means|involves)\s+(.{20,120}?)[.]',
        r'([A-Z][a-zA-Z\s]{2,30}):\s+(.{20,120}?)[.]',
    ]
    definitions = []
    for pat in patterns:
        for match in re.finditer(pat, text):
            term = match.group(1).strip()
            defn = match.group(2).strip()
            # Reject math fragments, short definitions, or invalid terms
            if not _is_valid_term(term):
                continue
            if any(c in _MATH_CHARS for c in defn):
                continue
            if len(term.split()) <= 5 and len(defn.split()) >= 5:
                definitions.append((term, defn))
    return definitions


def _extract_key_phrases(text: str) -> list[str]:
    """
    Extract key noun phrases using NLTK POS tagging.
    Finds consecutive NNP/NNPS (proper noun) sequences — the standard
    NLP approach for key-concept and named-entity extraction.
    """
    text = _clean_text(text)
    tokens = word_tokenize(text)
    tagged = pos_tag(tokens)

    phrases = []
    current_phrase: list[str] = []

    for word, tag in tagged:
        if tag in ('NNP', 'NNPS'):
            current_phrase.append(word)
        else:
            if current_phrase:
                phrase = ' '.join(current_phrase)
                if len(phrase) > 2:
                    phrases.append(phrase)
            current_phrase = []
    if current_phrase:
        phrases.append(' '.join(current_phrase))

    # De-duplicate, cap at 4 words, reject math/junk
    seen: set[str] = set()
    unique = []
    for p in phrases:
        pl = p.lower()
        if pl not in seen and len(p.split()) <= 4 and _is_valid_term(p):
            seen.add(pl)
            unique.append(p)
    return unique



def _make_definition_question(term: str, definition: str, all_terms: list[str]) -> dict | None:
    """Create a 'What is X?' style question from a definition."""
    # Filter distractors — must be clean readable terms, not math or junk
    distractors = [
        t for t in all_terms
        if t.lower() != term.lower() and _is_valid_term(t)
    ]
    if len(distractors) < 3:
        return None

    random.shuffle(distractors)
    options = distractors[:3] + [term]
    random.shuffle(options)

    return {
        "question": f"Which of the following is best described as: \"{definition}\"?",
        "options": options,
        "correct_index": options.index(term),
        "explanation": f"{term} — {definition}.",
    }


def _make_fill_in_blank(sentence: str, key_phrases: list[str]) -> dict | None:
    """Create a fill-in-the-blank question by removing a key phrase."""
    # Find which key phrase appears in this sentence
    target = None
    for phrase in key_phrases:
        if phrase.lower() in sentence.lower():
            target = phrase
            break

    if not target:
        # Fall back: pick a significant word (noun-like: 5+ chars, capitalized)
        words = sentence.split()
        candidates = [w.strip('.,;:!?()') for w in words
                       if len(w.strip('.,;:!?()')) >= 5 and w[0].isupper() and w.lower() not in
                       {'which', 'where', 'there', 'these', 'those', 'their', 'about', 'being',
                        'would', 'could', 'should', 'other', 'every', 'never', 'always'}]
        if not candidates:
            return None
        target = random.choice(candidates)

    # Build the blank sentence
    blank_sentence = re.sub(re.escape(target), '_____', sentence, count=1, flags=re.IGNORECASE)
    if blank_sentence == sentence:
        return None

    distractors = [p for p in key_phrases if p.lower() != target.lower()]
    if len(distractors) < 3:
        # Generate simple distractors by shuffling words
        words = [w.strip('.,;:!?()') for w in sentence.split() if len(w) >= 5 and w.lower() != target.lower()]
        distractors.extend(words)
        distractors = list(set(d for d in distractors if d.lower() != target.lower()))

    if len(distractors) < 3:
        return None

    random.shuffle(distractors)
    options = distractors[:3] + [target]
    random.shuffle(options)

    return {
        "question": f"Fill in the blank: \"{blank_sentence}\"",
        "options": options,
        "correct_index": options.index(target),
        "explanation": f"The correct answer is \"{target}\". Full sentence: {sentence}",
    }


def _make_true_false_style(sentence: str) -> dict | None:
    """Create a statement verification question."""
    words = sentence.split()
    if len(words) < 10:
        return None

    # The correct action is "True" for the original statement
    options = [
        "True",
        "False",
        "Partially true",
        "Not enough information",
    ]

    return {
        "question": f"True or False: \"{sentence}\"",
        "options": options,
        "correct_index": 0,  # The original sentence is true
        "explanation": f"This statement is correct as stated in the study material.",
    }

def _ai_generate_quiz(content_text: str, subject_name: str, num_questions: int) -> list[dict] | None:
    """
    Generate quiz questions using Gemini AI.
    Returns None if Gemini is unavailable (no key, rate limit, network error).
    Falls back gracefully — caller will use NLTK instead.
    """
    import os, json
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        logger.info("No GEMINI_API_KEY — using NLTK fallback")
        return None

    try:
        from google import genai
        client = genai.Client(api_key=api_key)

        # Truncate to avoid excessive token usage
        truncated = content_text[:6000]
        if len(content_text) > 6000:
            truncated += "\n... [content truncated]"

        prompt = f"""Generate exactly {num_questions} multiple choice questions from this study material about "{subject_name}".

Content:
{truncated}

Return ONLY a valid JSON array — no markdown, no code fences, no explanation.
Each object must have exactly this structure:
[
  {{
    "question": "Clear question about the content?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "explanation": "Brief reason why this option is correct."
  }}
]

Rules:
- Questions must be based strictly on the provided content
- Each question must have exactly 4 options
- correct_index is 0-3 (position of the correct answer in options)
- No math formulas, symbols, or single-word options
- Options must be meaningful readable phrases
- Vary question types (factual, conceptual, application)"""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )

        text = response.text.strip()
        # Strip markdown fences if Gemini adds them anyway
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if "```" in text:
                text = text[:text.rfind("```")].strip()

        data = json.loads(text)
        if not isinstance(data, list) or len(data) == 0:
            logger.warning("Gemini returned empty or non-list quiz")
            return None

        # Validate and sanitise each question
        valid = []
        for q in data:
            if (
                isinstance(q, dict)
                and isinstance(q.get("question"), str)
                and isinstance(q.get("options"), list)
                and len(q["options"]) == 4
                and isinstance(q.get("correct_index"), int)
                and 0 <= q["correct_index"] <= 3
            ):
                valid.append({
                    "question": q["question"],
                    "options": [str(o) for o in q["options"]],
                    "correct_index": q["correct_index"],
                    "explanation": q.get("explanation", ""),
                })

        if not valid:
            logger.warning("Gemini quiz had no valid questions after validation")
            return None

        logger.info(f"Gemini generated {len(valid)} quiz questions for '{subject_name}'")
        return valid[:num_questions]

    except json.JSONDecodeError as e:
        logger.warning(f"Gemini returned invalid JSON for quiz: {e}")
        return None
    except Exception as e:
        logger.warning(f"Gemini quiz generation failed ({type(e).__name__}): {e}")
        return None


def generate_quiz(content_text: str, subject_name: str, num_questions: int = 10) -> list[dict] | None:
    """
    Generate MCQ quiz questions from study material.
    Tries Gemini AI first for accurate questions; falls back to NLTK if unavailable.

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

    # ── Primary: Gemini AI (accurate, context-aware) ────────────────────────
    ai_questions = _ai_generate_quiz(content_text, subject_name, num_questions)
    if ai_questions:
        return ai_questions

    # ── Fallback: NLTK-based local generation ───────────────────────────────
    logger.info(f"Using NLTK fallback for '{subject_name}'")

    sentences = _extract_sentences(content_text)
    definitions = _extract_key_definitions(content_text)
    key_phrases = _extract_key_phrases(content_text)
    all_terms = [d[0] for d in definitions] + key_phrases

    questions: list[dict] = []
    used_sentences: set[int] = set()

    # 1. Definition questions
    random.shuffle(definitions)
    for term, defn in definitions:
        if len(questions) >= num_questions:
            break
        q = _make_definition_question(term, defn, all_terms)
        if q:
            questions.append(q)

    # 2. Fill-in-the-blank questions
    random.shuffle(sentences)
    for i, sent in enumerate(sentences):
        if len(questions) >= num_questions:
            break
        if i in used_sentences:
            continue
        q = _make_fill_in_blank(sent, key_phrases)
        if q:
            questions.append(q)
            used_sentences.add(i)

    # 3. True/False style questions
    for i, sent in enumerate(sentences):
        if len(questions) >= num_questions:
            break
        if i in used_sentences:
            continue
        q = _make_true_false_style(sent)
        if q:
            questions.append(q)
            used_sentences.add(i)

    if not questions:
        logger.error(f"Could not generate any questions for '{subject_name}' (sentences: {len(sentences)}, definitions: {len(definitions)})")
        return None

    random.shuffle(questions)
    logger.info(f"Generated {len(questions)} NLTK quiz questions for '{subject_name}'")
    return questions[:num_questions]
