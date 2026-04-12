"""
Studify Backend — FastAPI Application
PPT analysis, study time estimation, and timetable generation.
"""

import sys
import os

# Load .env before anything else
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Add backend directory to path so imports work
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import subjects, upload, timetable, dashboard, quiz, auth, prs

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Studify API",
    description="Upload PPT files, analyze study time, and generate timetables",
    version="1.0.0",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(subjects.router)
app.include_router(upload.router)
app.include_router(timetable.router)
app.include_router(dashboard.router)
app.include_router(quiz.router)
app.include_router(auth.router)
app.include_router(prs.router)


@app.get("/")
def root():
    return {"message": "Studify API is running", "docs": "/docs"}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}

