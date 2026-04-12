import os
import asyncio
import logging
from typing import Optional
from supabase import create_client, Client

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BUCKET_NAME = "materials"

_supabase: Optional[Client] = None

def _get_supabase() -> Optional[Client]:
    """Lazy-initialize the Supabase client on first use (after .env is loaded)."""
    global _supabase
    if _supabase is not None:
        return _supabase

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        logger.warning("SUPABASE_URL/KEY not set — storage disabled.")
        return None
    try:
        _supabase = create_client(url, key)
        logger.info("Supabase storage client initialized.")
    except Exception as e:
        logger.error(f"Supabase init failed: {e}")
    return _supabase


def _sync_upload(file_content: bytes, file_name: str, content_type: str) -> Optional[str]:
    """Synchronous upload — runs in a thread pool to avoid blocking the async event loop."""
    sb = _get_supabase()
    if not sb:
        return None
    try:
        sb.storage.from_(BUCKET_NAME).upload(
            path=file_name,
            file=file_content,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        return f"{BUCKET_NAME}/{file_name}"
    except Exception as e:
        logger.error(f"Supabase upload error: {e}")
        return None


async def upload_file_to_supabase(file_content: bytes, file_name: str, content_type: str) -> Optional[str]:
    """Upload a file to Supabase Storage. Runs sync SDK in thread pool."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _sync_upload, file_content, file_name, content_type)


def get_public_url(storage_path: str) -> Optional[str]:
    """Get a public URL for a file. Supabase bucket must be set to Public."""
    sb = _get_supabase()
    if not sb or not storage_path:
        return None
    try:
        parts = storage_path.split("/", 1)
        bucket = parts[0] if len(parts) > 1 else BUCKET_NAME
        path = parts[1] if len(parts) > 1 else storage_path
        url = sb.storage.from_(bucket).get_public_url(path)
        return url
    except Exception as e:
        logger.error(f"Error getting public URL: {e}")
        return None

def download_file_from_supabase(storage_path: str) -> Optional[bytes]:
    """Securely download a file using the Supabase SDK."""
    sb = _get_supabase()
    if not sb or not storage_path:
        return None
    try:
        parts = storage_path.split("/", 1)
        bucket = parts[0] if len(parts) > 1 else BUCKET_NAME
        path = parts[1] if len(parts) > 1 else storage_path
        return sb.storage.from_(bucket).download(path)
    except Exception as e:
        logger.error(f"Error downloading from Supabase: {e}")
        return None


def _sync_delete(storage_path: str):
    """Synchronous delete — used by the endpoint (which is sync)."""
    sb = _get_supabase()
    if not sb or not storage_path:
        return
    try:
        parts = storage_path.split("/", 1)
        bucket = parts[0] if len(parts) > 1 else BUCKET_NAME
        path = parts[1] if len(parts) > 1 else storage_path
        sb.storage.from_(bucket).remove([path])
    except Exception as e:
        logger.error(f"Error deleting from Supabase: {e}")


def delete_file_from_supabase(storage_path: str):
    _sync_delete(storage_path)

