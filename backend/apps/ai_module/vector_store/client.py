import os
import logging
from pathlib import Path
from django.conf import settings
from qdrant_client import QdrantClient

logger = logging.getLogger(__name__)

_client_instance = None


def get_qdrant_client() -> QdrantClient:
    """
    Singleton factory returning a persistent QdrantClient instance.
    Defaults to local file storage on disk at settings.QDRANT_STORAGE_PATH.
    Falls back gracefully if the disk storage is locked by another process.
    """
    global _client_instance
    if _client_instance is not None:
        return _client_instance

    storage_path = getattr(
        settings,
        "QDRANT_STORAGE_PATH",
        settings.BASE_DIR / "storage" / "qdrant_data"
    )

    # Ensure local directory exists
    os.makedirs(storage_path, exist_ok=True)

    try:
        _client_instance = QdrantClient(path=str(storage_path))
        return _client_instance
    except Exception as e:
        err_msg = str(e)
        if "already accessed by another instance" in err_msg or "lock" in err_msg.lower():
            logger.warning(f"[Qdrant Client] Storage path locked by another process: {err_msg}. Using in-memory fallback client.")
            try:
                _client_instance = QdrantClient(location=":memory:")
                return _client_instance
            except Exception:
                pass
        raise e


def close_qdrant_client():
    """Closes the client connection and releases file locks."""
    global _client_instance
    if _client_instance is not None:
        try:
            _client_instance.close()
        except Exception:
            pass
        _client_instance = None
