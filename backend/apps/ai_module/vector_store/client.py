import os
from pathlib import Path
from django.conf import settings
from qdrant_client import QdrantClient

_client_instance = None


def get_qdrant_client() -> QdrantClient:
    """
    Singleton factory returning a persistent QdrantClient instance.
    Defaults to local file storage on disk at settings.QDRANT_STORAGE_PATH.
    Does not require Docker or background daemons.
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

    _client_instance = QdrantClient(path=str(storage_path))
    return _client_instance


def close_qdrant_client():
    """Closes the client connection and releases file locks."""
    global _client_instance
    if _client_instance is not None:
        try:
            _client_instance.close()
        except Exception:
            pass
        _client_instance = None
