"""
Subject CRUD endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

import os
from database import get_db
from models.db_models import Subject, UploadedFile, FileAnalysis
from models.schemas import SubjectCreate, SubjectUpdate, SubjectResponse

router = APIRouter(prefix="/api/subjects", tags=["subjects"])


def _to_response(subject: Subject, db: Session = None) -> dict:
    """Convert ORM model to response dict using eagerly loaded relationships to prevent N+1."""
    files = getattr(subject, 'files', [])
    file_count = len(files)

    total_study_time = 0.0
    for f in files:
        if getattr(f, 'analysis', None):
            total_study_time += f.analysis.estimated_study_time or 0

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
    subjects = db.query(Subject).options(
        joinedload(Subject.files).joinedload(UploadedFile.analysis)
    ).order_by(Subject.created_at.desc()).all()
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
    subject = db.query(Subject).options(
        joinedload(Subject.files).joinedload(UploadedFile.analysis)
    ).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return _to_response(subject, db)


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(subject_id: str, data: SubjectUpdate, db: Session = Depends(get_db)):
    """Update a subject."""
    subject = db.query(Subject).options(
        joinedload(Subject.files).joinedload(UploadedFile.analysis)
    ).filter(Subject.id == subject_id).first()
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
    """Delete a subject and its files from disk and database."""
    subject = db.query(Subject).options(
        joinedload(Subject.files).joinedload(UploadedFile.analysis)
    ).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Manually remove all linked files from disk before deleting subject
    # This prevents orphaned files taking up space!
    for f in subject.files:
        if f.storage_path and os.path.exists(f.storage_path):
            try:
                os.remove(f.storage_path)
            except Exception:
                pass  # Gracefully continue if file deletion fails

    db.delete(subject)
    db.commit()
