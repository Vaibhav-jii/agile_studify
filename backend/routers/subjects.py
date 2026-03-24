"""
Subject CRUD endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import Subject, UploadedFile, FileAnalysis
from models.schemas import SubjectCreate, SubjectUpdate, SubjectResponse

router = APIRouter(prefix="/api/subjects", tags=["subjects"])


def _to_response(subject: Subject, db: Session) -> dict:
    """Convert ORM model to response dict with computed fields."""
    file_count = db.query(UploadedFile).filter(UploadedFile.subject_id == subject.id).count()

    # Sum up study time from all analyzed files in this subject
    total_study_time = 0.0
    analyses = (
        db.query(FileAnalysis)
        .join(UploadedFile)
        .filter(UploadedFile.subject_id == subject.id)
        .all()
    )
    for a in analyses:
        total_study_time += a.estimated_study_time or 0

    return {
        "id": subject.id,
        "name": subject.name,
        "description": subject.description,
        "color": subject.color,
        "file_count": file_count,
        "total_study_time": round(total_study_time, 1),
        "created_at": subject.created_at,
        "updated_at": subject.updated_at,
    }


@router.get("/", response_model=list[SubjectResponse])
def list_subjects(db: Session = Depends(get_db)):
    """List all subjects."""
    subjects = db.query(Subject).order_by(Subject.created_at.desc()).all()
    return [_to_response(s, db) for s in subjects]


@router.post("/", response_model=SubjectResponse, status_code=201)
def create_subject(data: SubjectCreate, db: Session = Depends(get_db)):
    """Create a new subject."""
    subject = Subject(
        name=data.name,
        description=data.description,
        color=data.color,
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return _to_response(subject, db)


@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(subject_id: str, db: Session = Depends(get_db)):
    """Get a subject by ID."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return _to_response(subject, db)


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(subject_id: str, data: SubjectUpdate, db: Session = Depends(get_db)):
    """Update a subject."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    if data.name is not None:
        subject.name = data.name
    if data.description is not None:
        subject.description = data.description
    if data.color is not None:
        subject.color = data.color

    db.commit()
    db.refresh(subject)
    return _to_response(subject, db)


@router.delete("/{subject_id}", status_code=204)
def delete_subject(subject_id: str, db: Session = Depends(get_db)):
    """Delete a subject and its files."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    db.delete(subject)
    db.commit()
