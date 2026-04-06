import os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv('.env')
from database import SessionLocal
from models.db_models import Subject, UploadedFile
from sqlalchemy import func

db = SessionLocal()
subjects = db.query(Subject).all()
files = db.query(UploadedFile).all()

data = {
    "subjects": [],
    "files": []
}

for s in subjects:
    cnt = db.query(func.count(UploadedFile.id)).filter(UploadedFile.subject_id == s.id).scalar()
    data["subjects"].append({"name": s.name, "id": s.id, "file_count": cnt})

for f in files:
    row = {"name": f.original_name, "subject_id": f.subject_id, "has_analysis": bool(f.analysis)}
    if f.analysis:
        row["est_mins"] = f.analysis.estimated_study_time
        row["ai_mins"] = f.analysis.ai_estimated_study_time
    data["files"].append(row)

print(json.dumps(data, indent=2))
