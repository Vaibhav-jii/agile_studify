"""
Dashboard endpoint — aggregates real data from the database.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta

from database import get_db
from models.db_models import Subject, UploadedFile, FileAnalysis

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Return aggregated stats for the dashboard.
    All data comes from real database records.
    """
    # Total subjects
    total_subjects = db.query(func.count(Subject.id)).scalar() or 0

    # Total files
    total_files = db.query(func.count(UploadedFile.id)).scalar() or 0

    # Total analyzed files (those with analysis)
    total_analyzed = db.query(func.count(FileAnalysis.id)).scalar() or 0

    # Total study time across all files (in minutes)
    total_study_minutes = (
        db.query(func.sum(FileAnalysis.estimated_study_time)).scalar() or 0.0
    )

    # Recent files (last 5 uploaded)
    recent_files = (
        db.query(UploadedFile)
        .order_by(UploadedFile.uploaded_at.desc())
        .limit(5)
        .all()
    )

    recent_analyses = []
    for f in recent_files:
        subject = db.query(Subject).filter(Subject.id == f.subject_id).first()
        analysis = f.analysis

        entry = {
            "id": f.id,
            "title": f.original_name,
            "subject": subject.name if subject else "Unknown",
            "subject_color": subject.color if subject else "#8B5CF6",
            "uploaded_at": f.uploaded_at.isoformat() if f.uploaded_at else None,
        }

        if analysis:
            entry.update({
                "estimated_hours": round(analysis.estimated_study_time / 60, 1),
                "difficulty": analysis.difficulty,
                "slide_count": analysis.slide_count,
                "word_count": analysis.total_word_count,
                "ai_reasoning": analysis.ai_reasoning,
            })

        recent_analyses.append(entry)

    # Subjects with their stats
    subjects = db.query(Subject).order_by(Subject.created_at.desc()).all()
    subject_stats = []
    for s in subjects:
        file_count = db.query(func.count(UploadedFile.id)).filter(
            UploadedFile.subject_id == s.id
        ).scalar() or 0

        study_time = (
            db.query(func.sum(FileAnalysis.estimated_study_time))
            .join(UploadedFile, FileAnalysis.file_id == UploadedFile.id)
            .filter(UploadedFile.subject_id == s.id)
            .scalar() or 0.0
        )

        subject_stats.append({
            "id": s.id,
            "name": s.name,
            "color": s.color,
            "file_count": file_count,
            "total_study_minutes": round(study_time, 1),
        })

    return {
        "total_subjects": total_subjects,
        "total_files": total_files,
        "total_analyzed": total_analyzed,
        "total_study_hours": round(total_study_minutes / 60, 1),
        "recent_analyses": recent_analyses,
        "subjects": subject_stats,
    }
