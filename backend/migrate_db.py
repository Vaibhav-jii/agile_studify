import os
import sys

# Add backend directory to path so imports work
sys.path.insert(0, os.path.dirname(__file__))

# Load .env file explicitly
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from sqlalchemy import create_engine, text
from collections import defaultdict

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in .env")
    sys.exit(1)

print(f"Connecting to: {DATABASE_URL[:40]}...")
engine = create_engine(DATABASE_URL)

def migrate():
    print("=== Studify DB Migration ===")

    with engine.begin() as conn:
        # ── 1. Create tables that are missing entirely ─────────────────
        print("\n[1] Creating missing tables (if any)...")
        # Import models AFTER engine is set up
        from database import Base
        # Just import models to register them
        from models.db_models import User, Subject, UploadedFile, FileAnalysis, MaterialRequest

        # We need to use this engine for create_all
        from sqlalchemy import create_engine as ce
        from database import Base as ModelBase
        ModelBase.metadata.create_all(engine)
        print("    Tables created/verified via ORM.")

        # ── 2. ALTER TABLE: subjects ──────────────────────────────────
        print("\n[2] Patching 'subjects' table...")
        try:
            conn.execute(text("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS owner_id VARCHAR;"))
            print("    ✓ owner_id added to subjects (or already existed)")
        except Exception as e:
            print(f"    ✗ subjects.owner_id error: {e}")

        # ── 3. ALTER TABLE: uploaded_files ────────────────────────────
        print("\n[3] Patching 'uploaded_files' table...")
        try:
            conn.execute(text("ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS uploader_id VARCHAR;"))
            print("    ✓ uploader_id added to uploaded_files (or already existed)")
        except Exception as e:
            print(f"    ✗ uploaded_files.uploader_id error: {e}")

        # ── 4. Verify column existence ────────────────────────────────
        print("\n[4] Verifying schema...")
        result = conn.execute(text("""
            SELECT table_name, column_name
            FROM information_schema.columns
            WHERE table_name IN ('subjects', 'uploaded_files', 'users', 'material_requests', 'file_analyses')
            ORDER BY table_name, column_name;
        """))
        rows = result.fetchall()

        cols_per_table = defaultdict(list)
        for tbl, col in rows:
            cols_per_table[tbl].append(col)

        for table, cols in sorted(cols_per_table.items()):
            print(f"\n    Table '{table}':")
            for c in cols:
                print(f"      - {c}")

    print("\n=== Migration Complete! ===")

if __name__ == "__main__":
    migrate()
