"""
Pydantic schemas for API request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


# ─── Subject Schemas ──────────────────────────────────────

class SubjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    color: str = Field(default="#8B5CF6", pattern=r"^#[0-9A-Fa-f]{6}$")


class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class SubjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    color: str
    file_count: int = 0
    total_study_time: float = 0.0  # minutes
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── File Schemas ─────────────────────────────────────────

class SlideDetail(BaseModel):
    slide_number: int
    word_count: int
    image_count: int
    has_text: bool
    has_images: bool
    estimated_minutes: float


class FileAnalysisResponse(BaseModel):
    slide_count: int
    total_word_count: int
    total_image_count: int
    total_char_count: int
    estimated_reading_time: float  # minutes
    estimated_study_time: float  # minutes
    difficulty: str
    slides: list[SlideDetail] = []
    # AI-powered fields (Gemini)
    ai_estimated_study_time: Optional[float] = None
    ai_difficulty: Optional[str] = None
    ai_key_topics: Optional[list[str]] = None
    ai_study_tips: Optional[list[str]] = None
    ai_reasoning: Optional[str] = None


class UploadedFileResponse(BaseModel):
    id: str
    file_name: str
    original_name: str
    file_type: str
    file_size: int
    subject_id: str
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None
    uploaded_at: datetime
    analysis: Optional[FileAnalysisResponse] = None

    class Config:
        from_attributes = True


# ─── Timetable Schemas ────────────────────────────────────

class TimetableRequest(BaseModel):
    subject_ids: list[str] = Field(..., min_length=1)
    hours_per_day: float = Field(default=4.0, gt=0, le=16)
    preferred_blocks: list[str] = Field(default=["Morning (6-12)", "Afternoon (12-18)"])
    exam_date: Optional[str] = None  # ISO date string
    days_count: int = Field(default=7, ge=1, le=60)
    learner_speed: Literal["slow", "medium", "fast"] = "medium"
    will_take_notes: bool = False


class StudySessionResponse(BaseModel):
    id: str
    subject: str
    subject_color: str
    title: str
    duration: int  # minutes
    start_time: str
    day: str  # e.g. "Monday", "2024-01-15"
    session_type: str  # "Deep focus", "Review", "Quick recap"


class TimetableResponse(BaseModel):
    sessions: list[StudySessionResponse]
    total_hours: float
    days: int
    subjects_covered: int


# ─── Quiz Schemas ─────────────────────────────────────────

class QuizRequest(BaseModel):
    subject_id: str = Field(..., min_length=1)
    num_questions: int = Field(default=10, ge=3, le=20)


class QuizQuestionResponse(BaseModel):
    question: str
    options: list[str]
    correct_index: int
    explanation: str = ""
