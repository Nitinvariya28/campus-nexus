import logging
from typing import List, Optional
from django.conf import settings

logger = logging.getLogger(__name__)

_embedding_service_instance = None


class EmbeddingService:
    """
    Singleton shared embedding service wrapping SentenceTransformers.
    Uses all-MiniLM-L6-v2 by default, producing normalized 384-dimensional dense vectors.
    """

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or getattr(
            settings,
            "EMBEDDING_MODEL_NAME",
            "sentence-transformers/all-MiniLM-L6-v2"
        )
        self.dimension = getattr(settings, "EMBEDDING_DIMENSION", 384)
        self._model = None

    @property
    def model(self):
        """Lazy loader for the SentenceTransformer model weights."""
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading embedding model: {self.model_name}...")
                try:
                    # Prefer local cached weights to avoid offline delays/network timeouts
                    self._model = SentenceTransformer(self.model_name, local_files_only=True)
                except Exception:
                    # Fall back to standard remote load if model is not yet cached locally
                    self._model = SentenceTransformer(self.model_name)
                logger.info(f"Model {self.model_name} loaded successfully (Dim: {self.dimension}).")
            except ImportError as e:
                logger.error("sentence-transformers is not installed. Please run: pip install sentence-transformers")
                raise e
            except Exception as e:
                logger.error(f"Failed to load embedding model {self.model_name}: {e}")
                raise e
        return self._model

    def embed_query(self, text: str) -> List[float]:
        """
        Embeds a single query string into a normalized 384-dimensional vector.
        L2 normalization ensures cosine similarity equals direct dot product.
        """
        if not text or not text.strip():
            raise ValueError("Text for embedding cannot be empty or purely whitespace.")

        sanitized_text = text.strip()
        embedding = self.model.encode(
            sanitized_text,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
        return embedding.tolist()

    def embed_documents(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """
        Batch embeds a list of document or profile chunk texts.
        Optimized for memory and CPU cache throughput.
        """
        if not texts:
            return []

        cleaned_texts = [t.strip() if t and t.strip() else " " for t in texts]
        embeddings = self.model.encode(
            cleaned_texts,
            batch_size=batch_size,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embeddings.tolist()

    def get_dimension(self) -> int:
        """Returns the configured vector dimension (384)."""
        return self.dimension


def get_embedding_service(model_name: Optional[str] = None) -> EmbeddingService:
    """Singleton accessor for EmbeddingService."""
    global _embedding_service_instance
    if _embedding_service_instance is None:
        _embedding_service_instance = EmbeddingService(model_name=model_name)
    return _embedding_service_instance
