from typing import Dict, Any, List, Optional

# Prohibited sensitive keys to strictly prevent PII leakage into Qdrant
PROHIBITED_PII_KEYS = {
    "password", "password_hash", "name", "first_name", "last_name", "full_name",
    "email", "personal_email", "university_email", "phone", "phone_number", "mobile",
    "address", "date_of_birth", "dob", "roll_number", "enrollment_number", "avatar", "photo", "profile_photo"
}


def _assert_no_pii(payload: Dict[str, Any]):
    """Guardrail: Raises ValueError if any prohibited PII key is found in the payload."""
    detected = PROHIBITED_PII_KEYS.intersection(payload.keys())
    if detected:
        raise ValueError(f"Security Violation: Payload contains prohibited PII fields: {detected}")


def build_student_payload(
    user_id: int,
    chunk_type: str,
    chunk_index: int,
    department_id: Optional[int],
    batch_id: Optional[int],
    semester: Optional[int],
    content_hash: str,
    department_code: Optional[str] = None,
    batch_period: Optional[str] = None,
    skills_count: Optional[int] = None,
    has_resume: bool = False,
    is_active: bool = True,
    embedding_model: str = "all-MiniLM-L6-v2",
    schema_version: int = 1,
) -> Dict[str, Any]:
    """
    Constructs a clean, normalized payload for student_vectors.
    Stores strictly structural relational keys and metadata. Zero personal PII.
    """
    payload = {
        "source_type": "STUDENT_PROFILE",
        "mysql_user_id": int(user_id),
        "role": "STUDENT",
        "chunk_type": str(chunk_type),
        "chunk_index": int(chunk_index),
        "department_id": int(department_id) if department_id is not None else None,
        "department_code": str(department_code) if department_code else None,
        "batch_id": int(batch_id) if batch_id is not None else None,
        "batch_period": str(batch_period) if batch_period else None,
        "semester": int(semester) if semester is not None else None,
        "skills_count": int(skills_count) if skills_count is not None else 0,
        "has_resume": bool(has_resume),
        "content_hash": str(content_hash),
        "embedding_model": str(embedding_model),
        "schema_version": int(schema_version),
        "is_active": bool(is_active),
    }
    _assert_no_pii(payload)
    return payload


def build_alumni_payload(
    user_id: int,
    chunk_type: str,
    chunk_index: int,
    company_id: Optional[int],
    department_id: Optional[int],
    graduation_year: Optional[int],
    experience_years: Optional[float],
    content_hash: str,
    company_name: Optional[str] = None,
    company_tier: Optional[str] = None,
    job_category: Optional[str] = None,
    is_active: bool = True,
    embedding_model: str = "all-MiniLM-L6-v2",
    schema_version: int = 1,
) -> Dict[str, Any]:
    """
    Constructs a clean, normalized payload for alumni_vectors.
    Stores career attributes and relational references. Zero personal PII.
    """
    payload = {
        "source_type": "ALUMNI_PROFILE",
        "mysql_user_id": int(user_id),
        "role": "ALUMNI",
        "chunk_type": str(chunk_type),
        "chunk_index": int(chunk_index),
        "company_id": int(company_id) if company_id is not None else None,
        "company_name": str(company_name) if company_name else None,
        "company_tier": str(company_tier) if company_tier else None,
        "job_category": str(job_category) if job_category else None,
        "department_id": int(department_id) if department_id is not None else None,
        "graduation_year": int(graduation_year) if graduation_year is not None else None,
        "experience_years": float(experience_years) if experience_years is not None else None,
        "content_hash": str(content_hash),
        "embedding_model": str(embedding_model),
        "schema_version": int(schema_version),
        "is_active": bool(is_active),
    }
    _assert_no_pii(payload)
    return payload


def build_post_payload(
    post_id: int,
    entity_type: str,
    author_role: str,
    company_id: Optional[int] = None,
    company_name: Optional[str] = None,
    company_tier: Optional[str] = None,
    opportunity_type: Optional[str] = None,
    salary_package: Optional[str] = None,
    min_cgpa: Optional[float] = None,
    eligible_department_ids: Optional[List[int]] = None,
    eligible_batch_ids: Optional[List[int]] = None,
    application_deadline: Optional[str] = None,
    status: str = "OPEN",
    is_active: bool = True,
) -> Dict[str, Any]:
    """
    Constructs payload for opportunity_post_vectors.
    Enables instant eligibility filtering by department, batch, status, and active deadline.
    """
    payload = {
        "source_type": "COMMUNITY_POST",
        "post_id": int(post_id),
        "entity_type": str(entity_type),
        "author_role": str(author_role),
        "company_id": int(company_id) if company_id is not None else None,
        "company_name": str(company_name) if company_name else None,
        "company_tier": str(company_tier) if company_tier else None,
        "opportunity_type": str(opportunity_type) if opportunity_type else None,
        "salary_package": str(salary_package) if salary_package else None,
        "min_cgpa": float(min_cgpa) if min_cgpa is not None else None,
        "eligible_department_ids": list(eligible_department_ids or []),
        "eligible_batch_ids": list(eligible_batch_ids or []),
        "application_deadline": str(application_deadline) if application_deadline else None,
        "status": str(status),
        "is_active": bool(is_active),
    }
    _assert_no_pii(payload)
    return payload


def build_knowledge_payload(
    source_id: str,
    chunk_id: int,
    category: str,
    title: str,
    section: Optional[str],
    source_url: Optional[str],
    chunk_text: str,
    company_id: Optional[int] = None,
    company_name: Optional[str] = None,
    access_level: str = "PUBLIC",
) -> Dict[str, Any]:
    """
    Constructs payload for knowledge_vectors.
    STORES raw chunk_text in payload so the RAG context builder can inject it directly into the LLM prompt.
    """
    payload = {
        "source_id": str(source_id),
        "chunk_id": int(chunk_id),
        "category": str(category),
        "title": str(title),
        "section": str(section) if section else None,
        "source_url": str(source_url) if source_url else None,
        "chunk_text": str(chunk_text),
        "company_id": int(company_id) if company_id is not None else None,
        "company_name": str(company_name) if company_name else None,
        "access_level": str(access_level),
    }
    _assert_no_pii(payload)
    return payload
