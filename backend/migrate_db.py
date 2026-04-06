import os
import sys

# Add backend directory to path so imports work
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from database import engine

def migrate():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE subjects ADD COLUMN owner_id VARCHAR;"))
            print("Added owner_id to subjects")
        except Exception as e:
            print(f"Skipping subjects alter: {e}")
            
        try:
            conn.execute(text("ALTER TABLE uploaded_files ADD COLUMN uploader_id VARCHAR;"))
            print("Added uploader_id to uploaded_files")
        except Exception as e:
            print(f"Skipping uploaded_files alter: {e}")

if __name__ == "__main__":
    migrate()
