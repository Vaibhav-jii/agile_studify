"""
Local quiz generation from PPT/study material content.
Generates MCQ questions without any AI/Gemini dependency.
Uses NLP heuristics: extracts key sentences, creates definition-based
fill-in-the-blank and conceptual MCQs.
"""

import re
import random
import logging

logger = logging.getLogger(__name__)


def _clean_text(text: str) -> str:
    """Normalize whitespace and remove junk from slide text."""
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\x20-\x7E\n]', '', text)  # ASCII printable only
    return text.strip()


def _extract_sentences(text: str) -> list[str]:
    """Split text into meaningful sentences (min 8 words)."""
    text = _clean_text(text)
    # Split on sentence-ending punctuation
    raw = re.split(r'(?<=[.!?])\s+', text)
    sentences = []
    for s in raw:
        s = s.strip()
        words = s.split()
        if len(words) >= 8 and len(words) <= 40:
            sentences.append(s)
    return sentences


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
            if len(term.split()) <= 5 and len(defn.split()) >= 5:
                definitions.append((term, defn))
    return definitions


def _extract_key_phrases(text: str) -> list[str]:
    """Extract important multi-word phrases (potential quiz answers)."""
    # Find capitalized multi-word phrases (likely proper nouns / concepts)
    phrases = re.findall(r'\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)\b', text)
    # De-duplicate while preserving order
    seen = set()
    unique = []
    for p in phrases:
        pl = p.lower()
        if pl not in seen and len(p.split()) <= 4:
            seen.add(pl)
            unique.append(p)
    return unique


def _make_definition_question(term: str, definition: str, all_terms: list[str]) -> dict | None:
    """Create a 'What is X?' style question from a definition."""
    distractors = [t for t in all_terms if t.lower() != term.lower()]
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


def generate_quiz(content_text: str, subject_name: str, num_questions: int = 10) -> list[dict] | None:
    """
    Generate MCQ quiz questions locally from study material content.
    No AI/Gemini required — uses text analysis heuristics.

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

    # Shuffle final order
    random.shuffle(questions)

    logger.info(f"Generated {len(questions)} local quiz questions for '{subject_name}'")
    return questions[:num_questions]
