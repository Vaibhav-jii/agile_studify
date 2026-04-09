"""
Time estimation service.
Estimates how long it will take to study a PPT based on content analysis.
"""

from services.ppt_parser import PptParseResult, SlideInfo


# ─── Tuning constants ─────────────────────────────────────
# Average words-per-minute reading speed for slide material
# (slides are scanned/skimmed, not read like textbooks)
READING_WPM = 450

# Minutes to spend per image (diagrams, charts, figures)
MINUTES_PER_IMAGE = 0.2

# Base time per slide even if it's mostly empty (title slides, transitions)
BASE_MINUTES_PER_SLIDE = 0.1

# Difficulty thresholds (words per slide average)
EASY_THRESHOLD = 40     # ≤40 words/slide → easy
HARD_THRESHOLD = 120    # ≥120 words/slide → hard

# Study multiplier over raw reading time (note-taking, comprehension)
STUDY_MULTIPLIER = 1.0


class SlideTimeEstimate:
    """Time estimate for a single slide."""

    def __init__(self, slide_number: int, estimated_minutes: float,
                 word_count: int, image_count: int,
                 has_text: bool, has_images: bool):
        self.slide_number = slide_number
        self.estimated_minutes = round(estimated_minutes, 1)
        self.word_count = word_count
        self.image_count = image_count
        self.has_text = has_text
        self.has_images = has_images


class TimeEstimateResult:
    """Full time estimate for a PPT file."""

    def __init__(self):
        self.slides: list[SlideTimeEstimate] = []
        self.estimated_reading_minutes: float = 0.0
        self.estimated_study_minutes: float = 0.0
        self.difficulty: str = "medium"


def estimate_time(parse_result: PptParseResult) -> TimeEstimateResult:
    """
    Estimate study time based on PPT content analysis.

    Calculation:
    - Reading time = word_count / READING_WPM
    - Image time = image_count * MINUTES_PER_IMAGE
    - Slide base time = BASE_MINUTES_PER_SLIDE per slide
    - Study time = reading_time * STUDY_MULTIPLIER
    """
    result = TimeEstimateResult()
    total_reading_minutes = 0.0

    for slide in parse_result.slides:
        # Time to read text on this slide
        reading_time = slide.word_count / READING_WPM if slide.word_count > 0 else 0

        # Time to study images
        image_time = slide.image_count * MINUTES_PER_IMAGE

        # Base time for every slide
        slide_time = BASE_MINUTES_PER_SLIDE + reading_time + image_time

        total_reading_minutes += slide_time

        result.slides.append(SlideTimeEstimate(
            slide_number=slide.slide_number,
            estimated_minutes=slide_time,
            word_count=slide.word_count,
            image_count=slide.image_count,
            has_text=slide.has_text,
            has_images=slide.has_images,
        ))

    result.estimated_reading_minutes = round(total_reading_minutes, 1)
    result.estimated_study_minutes = round(total_reading_minutes * STUDY_MULTIPLIER, 1)

    # Determine difficulty
    if parse_result.total_slides > 0:
        avg_words = parse_result.total_word_count / parse_result.total_slides
        if avg_words <= EASY_THRESHOLD:
            result.difficulty = "easy"
        elif avg_words >= HARD_THRESHOLD:
            result.difficulty = "hard"
        else:
            result.difficulty = "medium"

    return result
