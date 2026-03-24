"""
Timetable generation endpoint.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import Subject, UploadedFile, FileAnalysis
from models.schemas import TimetableRequest, TimetableResponse
from services.scheduler import generate_timetable

router = APIRouter(prefix="/api/timetable", tags=["timetable"])


@router.post("/generate", response_model=TimetableResponse)
def create_timetable(request: TimetableRequest, db: Session = Depends(get_db)):
    """
    Generate a study timetable based on uploaded materials.
    Looks up total study time per subject from file analyses.
    """
    subjects_data = []

    for subject_id in request.subject_ids:
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            raise HTTPException(status_code=404, detail=f"Subject '{subject_id}' not found")

        # Sum up study time from all analyzed files for this subject
        total_study_minutes = 0.0
        analyses = (
            db.query(FileAnalysis)
            .join(UploadedFile)
            .filter(UploadedFile.subject_id == subject_id)
            .all()
        )
        for a in analyses:
            total_study_minutes += a.estimated_study_time or 0

        # Default to 60 minutes if no files analyzed yet
        if total_study_minutes == 0:
            total_study_minutes = 60.0

        subjects_data.append({
            "id": subject.id,
            "name": subject.name,
            "color": subject.color,
            "total_study_minutes": total_study_minutes,
        })

    result = generate_timetable(
        subjects=subjects_data,
        hours_per_day=request.hours_per_day,
        preferred_blocks=request.preferred_blocks,
        exam_date=request.exam_date,
        days_count=request.days_count,
        learner_speed=request.learner_speed,
        will_take_notes=request.will_take_notes,
    )

    return result
