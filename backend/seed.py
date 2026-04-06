import os
import sys

# Add backend directory to path so imports work
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine
from models.db_models import User, Base
from routers.auth import hash_pass

def seed_users():
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if users already exist
    if db.query(User).first():
        print("Users already seeded! Skipping.")
        db.close()
        return

    users = [
        User(email="admin@studify.com", hashed_password=hash_pass("admin123"), role="admin", full_name="Super Admin"),
        User(email="teacher@studify.com", hashed_password=hash_pass("teacher123"), role="teacher", full_name="Dr. Smith"),
        User(email="student@studify.com", hashed_password=hash_pass("student123"), role="student", full_name="Alex Student"),
    ]

    for u in users:
        db.add(u)
    
    db.commit()
    print("Successfully seeded Admin, Teacher, and Student accounts!")
    db.close()

if __name__ == "__main__":
    seed_users()
