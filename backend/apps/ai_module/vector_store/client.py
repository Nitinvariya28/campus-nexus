import os
import time
import logging
import threading
from pathlib import Path
from django.conf import settings
from qdrant_client import QdrantClient

logger = logging.getLogger(__name__)

_client_instance = None
_client_lock = threading.Lock()


def get_qdrant_client() -> QdrantClient:
    """
    Thread-safe singleton factory returning a persistent QdrantClient instance.
    Defaults to local file storage on disk at settings.QDRANT_STORAGE_PATH.
    Handles Windows file locking gracefully with retries and fallback.
    """
    global _client_instance
    if _client_instance is not None:
        return _client_instance

    with _client_lock:
        if _client_instance is not None:
            return _client_instance

        storage_path = getattr(
            settings,
            "QDRANT_STORAGE_PATH",
            settings.BASE_DIR / "storage" / "qdrant_data"
        )

        # Ensure local directory exists
        os.makedirs(storage_path, exist_ok=True)

        for attempt in range(3):
            try:
                _client_instance = QdrantClient(path=str(storage_path))
                return _client_instance
            except Exception as e:
                err_msg = str(e).lower()
                is_lock_error = any(phrase in err_msg for phrase in [
                    "already accessed by another instance",
                    "permission denied",
                    "process cannot access the file",
                    "locked",
                    "lock",
                ]) or isinstance(e, PermissionError)

                if is_lock_error:
                    if attempt < 2:
                        time.sleep(0.3 * (attempt + 1))
                        continue
                    logger.warning(
                        f"[Qdrant Client] Storage path '{storage_path}' locked by another process: {e}. "
                        "Using in-memory fallback client."
                    )
                    try:
                        _client_instance = QdrantClient(location=":memory:")
                        return _client_instance
                    except Exception:
                        pass
                raise e


def close_qdrant_client():
    """Closes the client connection and releases file locks cleanly."""
    global _client_instance
    with _client_lock:
        if _client_instance is not None:
            try:
                _client_instance.close()
            except Exception:
                pass
            _client_instance = None
