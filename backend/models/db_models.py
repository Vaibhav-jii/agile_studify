"""
SQLAlchemy ORM models for Studify database.
"""

from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=False, default="#8B5CF6")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    files = relationship("UploadedFile", back_populates="subject", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Subject(name='{self.name}')>"


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(String, primary_key=True, default=generate_uuid)
    file_name = Column(String(500), nullable=False)
    original_name = Column(String(500), nullable=False)
    file_type = Column(String(10), nullable=False)  # ppt, pdf, doc, video
    file_size = Column(Integer, nullable=False)  # bytes
    storage_path = Column(String(1000), nullable=False)  # path on disk
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    subject = relationship("Subject", back_populates="files")
    analysis = relationship("FileAnalysis", back_populates="file", uselist=False,
                            cascade="all, delete-orphan")

    def __repr__(self):
        return f"<UploadedFile(name='{self.original_name}')>"


class FileAnalysis(Base):
    __tablename__ = "file_analyses"

    id = Column(String, primary_key=True, default=generate_uuid)
    file_id = Column(String, ForeignKey("uploaded_files.id"), nullable=False, unique=True)

    # PPT-specific analysis
    slide_count = Column(Integer, default=0)
    total_word_count = Column(Integer, default=0)
    total_image_count = Column(Integer, default=0)
    total_char_count = Column(Integer, default=0)

    # Time estimates (in minutes)
    estimated_reading_time = Column(Float, default=0.0)
    estimated_study_time = Column(Float, default=0.0)

    # Content difficulty
    difficulty = Column(String(10), default="medium")  # easy, medium, hard

    # Per-slide breakdown stored as JSON string
    slide_details_json = Column(Text, nullable=True)

    # ── AI-powered analysis (Gemini) ──────────────────────
    ai_estimated_study_time = Column(Float, nullable=True)   # Gemini's estimate (minutes)
    ai_difficulty = Column(String(10), nullable=True)         # Gemini's difficulty rating
    ai_key_topics = Column(Text, nullable=True)               # JSON array of topics
    ai_study_tips = Column(Text, nullable=True)               # JSON array of tips
    ai_reasoning = Column(Text, nullable=True)                # Gemini's reasoning

    analyzed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    file = relationship("UploadedFile", back_populates="analysis")

    def __repr__(self):
        return f"<FileAnalysis(file_id='{self.file_id}', slides={self.slide_count})>"
