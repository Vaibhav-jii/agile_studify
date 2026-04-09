"""
Pull Request (Material Request) endpoints.
Allows students to submit drafts, and teachers to approve/reject them.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import uuid
import logging

from database import get_db
from models.db_models import MaterialRequest, Subject, UploadedFile, User

# We import the internal logic from upload router to trigger the AI analysis 
# upon teacher approval
from routers.upload import ALLOWED_EXTENSIONS, UPLOAD_DIR, ai_estimate, parse_pdf, parse_pptx, estimate_time, _build_file_response, _get_media_type
from models.db_models import FileAnalysis
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/prs", tags=["pull_requests"])

@router.post("/submit", status_code=201)
async def submit_pr(
    file: UploadFile = File(...),
    subject_id: str = Form(...),
    student_id: str = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    db: Session = Depends(get_db),
):
    """Student submits a new material for review."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    original_name = file.filename or "unknown"
    ext = os.path.splitext(original_name)[1].lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not supported.")

    file_type = "other"
    if ext in (".ppt", ".pptx"):
        file_type = "ppt"
    elif ext == ".pdf":
        file_type = "pdf"
    elif ext in (".doc", ".docx"):
        file_type = "doc"

    # Save to disk as a draft
    file_id = str(uuid.uuid4())
    safe_name = f"draft_{file_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    content = await file.read()
    file_size = len(content)
    with open(file_path, "wb") as f:
        f.write(content)

    pr_record = MaterialRequest(
        id=file_id,
        student_id=student_id,
        subject_id=subject_id,
        title=title,
        description=description,
        file_name=safe_name,
        original_name=original_name,
        file_type=file_type,
        file_size=file_size,
        storage_path=file_path,
        status="pending"
    )
    db.add(pr_record)
    db.commit()
    db.refresh(pr_record)
    return {"message": "Pull Request submitted", "id": pr_record.id}


@router.get("/pending")
def list_pending_prs(subject_id: str | None = None, db: Session = Depends(get_db)):
    """Teacher views pending PRs."""
    query = db.query(MaterialRequest).filter(MaterialRequest.status == "pending")
    if subject_id:
        query = query.filter(MaterialRequest.subject_id == subject_id)
        
    prs = query.order_by(MaterialRequest.created_at.desc()).all()
    
    result = []
    for pr in prs:
        student = db.query(User).filter(User.id == pr.student_id).first()
        result.append({
            "id": pr.id,
            "title": pr.title,
            "description": pr.description,
            "student_name": student.full_name if student else "Unknown Student",
            "file_name": pr.original_name,
            "file_type": pr.file_type,
            "file_size": pr.file_size,
            "subject_id": pr.subject_id,
            "created_at": pr.created_at
        })
    return result


@router.get("/{pr_id}/download")
def download_pr_file(pr_id: str, db: Session = Depends(get_db)):
    """Download/preview a PR draft file so a teacher can review it before approving."""
    pr = db.query(MaterialRequest).filter(MaterialRequest.id == pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")

    if not os.path.exists(pr.storage_path):
        raise HTTPException(status_code=404, detail="Draft file not found on disk")

    return FileResponse(
        path=pr.storage_path,
        filename=pr.original_name,
        media_type=_get_media_type(pr.original_name),
    )


@router.post("/{pr_id}/approve")
def approve_pr(pr_id: str, db: Session = Depends(get_db)):
    """Teacher approves PR: Moves to official files and runs AI analysis."""
    pr = db.query(MaterialRequest).filter(MaterialRequest.id == pr_id).first()
    if not pr or pr.status != "pending":
        raise HTTPException(status_code=404, detail="PR not found or not pending")

    # Change status
    pr.status = "approved"

    # 1. Create official UploadedFile
    file_record = UploadedFile(
        id=str(uuid.uuid4()),
        file_name=pr.file_name,
        original_name=pr.original_name,
        file_type=pr.file_type,
        file_size=pr.file_size,
        storage_path=pr.storage_path,
        subject_id=pr.subject_id,
        uploader_id=pr.student_id  # Credit the student!
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)

    # 2. Run Analysis (Copied from upload.py logic)
    ext = os.path.splitext(pr.original_name)[1].lower()
    if pr.file_type in ("ppt", "pdf"):
        try:
            if pr.file_type == "ppt" and ext == ".pptx":
                parse_result = parse_pptx(pr.storage_path)
            elif pr.file_type == "pdf":
                parse_result = parse_pdf(pr.storage_path)
            else:
                return {"message": "Approved without analysis", "file_id": file_record.id}

            time_result = estimate_time(parse_result)

            slide_details = [
                {
                    "slide_number": s.slide_number,
                    "word_count": s.word_count,
                    "image_count": s.image_count,
                    "has_text": s.has_text,
                    "has_images": s.has_images,
                    "estimated_minutes": s.estimated_minutes,
                }
                for s in time_result.slides
            ]

            analysis = FileAnalysis(
                file_id=file_record.id,
                slide_count=parse_result.total_slides,
                total_word_count=parse_result.total_word_count,
                total_image_count=parse_result.total_image_count,
                total_char_count=parse_result.total_char_count,
                estimated_reading_time=time_result.estimated_reading_minutes,
                estimated_study_time=time_result.estimated_study_minutes,
                difficulty=time_result.difficulty,
                slide_details_json=json.dumps(slide_details),
            )

            try:
                ai_result = ai_estimate(
                    extracted_text=parse_result.full_text,
                    slide_count=parse_result.total_slides,
                    word_count=parse_result.total_word_count,
                    image_count=parse_result.total_image_count,
                )
                if ai_result:
                    analysis.ai_estimated_study_time = ai_result.estimated_study_minutes
                    analysis.ai_difficulty = ai_result.difficulty
                    analysis.ai_key_topics = json.dumps(ai_result.key_topics)
                    analysis.ai_study_tips = json.dumps(ai_result.study_tips)
                    analysis.ai_reasoning = ai_result.reasoning
                    analysis.estimated_study_time = ai_result.estimated_study_minutes
                    analysis.difficulty = ai_result.difficulty
            except Exception as ai_err:
                logger.warning(f"AI estimation failed on PR {pr.id}: {ai_err}")

            db.add(analysis)
            db.commit()
        except Exception as e:
            logger.error(f"Analysis failed for approved PR {pr.id}: {e}")

    return {"message": "Approved successfully", "file": _build_file_response(file_record, db)}


@router.post("/{pr_id}/reject")
def reject_pr(pr_id: str, db: Session = Depends(get_db)):
    """Teacher rejects PR: Just updates status, maybe deletes file."""
    pr = db.query(MaterialRequest).filter(MaterialRequest.id == pr_id).first()
    if not pr or pr.status != "pending":
        raise HTTPException(status_code=404, detail="PR not found or not pending")

    pr.status = "rejected"
    # Optional: Delete the draft file from disk to save space
    if os.path.exists(pr.storage_path):
        os.remove(pr.storage_path)

    db.commit()
    return {"message": "Pull Request rejected"}

