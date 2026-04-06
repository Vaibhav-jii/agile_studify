import os
import logging
from typing import Optional, Tuple
from supabase import create_client, Client

logger = logging.getLogger(__name__)

# Config from .env
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
# Create a default bucket called 'materials'
BUCKET_NAME = "materials"

supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")

async def upload_file_to_supabase(file_content: bytes, file_name: str, content_type: str) -> Optional[str]:
    """
    Uploads a file to Supabase Storage bucket and returns its path.
    """
    if not supabase:
        logger.warning("Supabase storage not configured. Using local fallback.")
        return None

    try:
        # Example path: 2024/04/file_id.pptx
        # For simplicity just use filenames here
        response = supabase.storage.from_(BUCKET_NAME).upload(
            path=file_name,
            file=file_content,
            file_options={"content-type": content_type}
        )
        return f"{BUCKET_NAME}/{file_name}"
    except Exception as e:
        logger.error(f"Supabase upload error: {e}")
        return None

def get_public_url(storage_path: str) -> Optional[str]:
    """Get a public signed URL for the user to download the file."""
    if not supabase or not storage_path:
        return None
        
    try:
        bucket, path = storage_path.split("/", 1)
        response = supabase.storage.from_(bucket).get_public_url(path)
        return response
    except Exception as e:
        logger.error(f"Error getting public URL: {e}")
        return None

def delete_file_from_supabase(storage_path: str):
    """Delete the file from storage."""
    if not supabase or not storage_path:
        return
        
    try:
        bucket, path = storage_path.split("/", 1)
        supabase.storage.from_(bucket).remove([path])
    except Exception as e:
        logger.error(f"Error deleting file from Supabase storage: {e}")
