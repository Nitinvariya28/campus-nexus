import uuid

# Fixed Global Namespace for all AlumiBridge AI Vectors
AI_NAMESPACE = uuid.UUID("a1b2c3d4-e5f6-7890-1234-56789abcdef0")


def generate_student_point_id(user_id: int, chunk_type: str, chunk_index: int = 0) -> str:
    """
    Generates a deterministic UUID5 point ID for a student profile chunk.
    Example seed: 'student:101:STUDENT_SKILLS:0'
    Guarantees idempotent upserts with zero duplicate points.
    """
    seed = f"student:{user_id}:{chunk_type}:{chunk_index}"
    return str(uuid.uuid5(AI_NAMESPACE, seed))


def generate_alumni_point_id(user_id: int, chunk_type: str, chunk_index: int = 0) -> str:
    """
    Generates a deterministic UUID5 point ID for an alumni profile chunk.
    Example seed: 'alumni:205:ALUMNI_CAREER:0'
    """
    seed = f"alumni:{user_id}:{chunk_type}:{chunk_index}"
    return str(uuid.uuid5(AI_NAMESPACE, seed))


def generate_post_point_id(post_id: int) -> str:
    """
    Generates a deterministic UUID5 point ID for a Placement Cell community post or opportunity.
    Example seed: 'post:105'
    """
    seed = f"post:{post_id}"
    return str(uuid.uuid5(AI_NAMESPACE, seed))


def generate_knowledge_point_id(source_id: str, chunk_id: int) -> str:
    """
    Generates a deterministic UUID5 point ID for a RAG knowledge document chunk.
    Example seed: 'knowledge:NSU_PLACEMENT_POLICY_2026:14'
    """
    seed = f"knowledge:{source_id}:{chunk_id}"
    return str(uuid.uuid5(AI_NAMESPACE, seed))
