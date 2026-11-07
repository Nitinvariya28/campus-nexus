import logging
from typing import Dict, Any, List, Tuple, Union, Optional
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

User = get_user_model()


def is_profile_ready(user: Any) -> Tuple[bool, str]:
    """
    Evaluates whether a User profile possesses sufficient information to be vectorized.
    Ensures active users with any skill, department, or bio are ready for recommendations.
    """
    if not getattr(user, "is_active", True):
        return False, "User account is inactive or deactivated"

    role = str(getattr(user, "role", "") or "").upper()

    # Check skills
    has_skills = False
    if hasattr(user, "user_skills"):
        has_skills = user.user_skills.exists() if hasattr(user.user_skills, "exists") else len(user.user_skills.all()) > 0

    if role == "STUDENT":
        profile = getattr(user, "student_profile", None)
        has_dept = bool(profile and getattr(profile, "department_id", None))
        has_bio = bool(profile and profile.bio and len(profile.bio.strip()) >= 3)
        if has_skills or has_dept or has_bio:
            return True, "Ready"
        return False, "Student has no skills, department, or bio"

    elif role == "ALUMNI":
        profile = getattr(user, "alumni_profile", None)
        has_career = bool(profile and (profile.current_job_title or getattr(profile, "current_company_id", None)))
        has_dept = bool(profile and getattr(profile, "department_id", None))
        has_bio = bool(profile and profile.bio and len(profile.bio.strip()) >= 3)
        if has_skills or has_career or has_dept or has_bio:
            return True, "Ready"
        return False, "Alumni has no skills, career details, or bio"

    return True, "Ready"


def get_user_with_full_profile(user_or_id: Union[Any, int]) -> Any:
    """
    Fetches user with all related profiles, skills, AI usage, and social links
    in an optimized query avoiding N+1 database hits.
    """
    if isinstance(user_or_id, int):
        user_qs = User.objects.filter(id=user_or_id).select_related(
            "student_profile__department",
            "student_profile__batch",
            "alumni_profile__department",
            "alumni_profile__batch",
            "alumni_profile__current_company",
        ).prefetch_related(
            "user_skills__skill__category",
            "ai_usages",
            "social_links",
            "resumes__analyses",
        )
        user = user_qs.first()
        if not user:
            raise ValueError(f"User with id {user_or_id} does not exist.")
        return user
    return user_or_id


def build_student_document(user: Any) -> Dict[str, Any]:
    """
    Extracts whitelisted student data and formats it into 3 distinct semantic facets:
    1. STUDENT_ACADEMIC
    2. STUDENT_SKILLS
    3. STUDENT_CAREER
    Strictly excludes all PII (names, emails, phones, photos, addresses, roll numbers).
    """
    profile = getattr(user, "student_profile", None)
    if not profile:
        raise ValueError(f"User #{user.id} has no StudentProfile.")

    department = getattr(profile, "department", None)
    batch = getattr(profile, "batch", None)

    # 1. Group skills by proficiency level
    user_skills = list(user.user_skills.all()) if hasattr(user, "user_skills") else []
    skills_by_proficiency: Dict[str, List[str]] = {
        "ADVANCED": [],
        "INTERMEDIATE": [],
        "BEGINNER": [],
    }
    for us in user_skills:
        prof = us.proficiency if us.proficiency in skills_by_proficiency else "INTERMEDIATE"
        skill_name = us.skill.name if us.skill else ""
        if skill_name:
            skills_by_proficiency[prof].append(skill_name)

    # 2. Extract AI usages
    ai_usages = list(user.ai_usages.all()) if hasattr(user, "ai_usages") else []
    ai_summary_parts = []
    for ai in ai_usages:
        tool = ai.get_ai_tool_display() if hasattr(ai, "get_ai_tool_display") else ai.ai_tool
        purpose = ai.get_usage_purpose_display() if hasattr(ai, "get_usage_purpose_display") else ai.usage_purpose
        ai_summary_parts.append(f"{tool} for {purpose}")

    # 3. Extract coding social platforms
    social_links = list(user.social_links.all()) if hasattr(user, "social_links") else []
    coding_platforms = [
        s.get_platform_display() if hasattr(s, "get_platform_display") else s.platform
        for s in social_links
    ]

    # 4. Check for resume
    has_resume = user.resumes.exists() if hasattr(user, "resumes") else False

    # Check for student placement record
    placement_rec = getattr(profile, "placements", None)
    placement = placement_rec.first() if placement_rec else None

    # --- Facet 1: STUDENT_ACADEMIC ---
    academic_parts = [
        "Student Academic Profile.",
        f"Department: {department.name} (Code: {department.code})." if department else "",
        f"Batch Period: {batch.start_year}-{batch.end_year}." if batch else "",
        f"Current Semester: Semester {profile.semester}." if profile.semester else "",
        f"Academic Overview: {profile.bio.strip()}" if profile.bio else "",
    ]
    academic_text = " ".join([p for p in academic_parts if p])

    # --- Facet 2: STUDENT_SKILLS ---
    skills_parts = ["Student Technical Skills and Proficiencies."]
    if skills_by_proficiency["ADVANCED"]:
        skills_parts.append(f"Advanced Skills: {', '.join(skills_by_proficiency['ADVANCED'])}.")
    if skills_by_proficiency["INTERMEDIATE"]:
        skills_parts.append(f"Intermediate Skills: {', '.join(skills_by_proficiency['INTERMEDIATE'])}.")
    if skills_by_proficiency["BEGINNER"]:
        skills_parts.append(f"Beginner Skills: {', '.join(skills_by_proficiency['BEGINNER'])}.")
    if ai_summary_parts:
        skills_parts.append(f"AI Development Tools: {'; '.join(ai_summary_parts)}.")
    skills_text = " ".join(skills_parts)

    # --- Facet 3: STUDENT_CAREER ---
    career_parts = ["Student Career Aspirations and Projects."]
    if coding_platforms:
        career_parts.append(f"Active Development Platforms: {', '.join(coding_platforms)}.")
    if placement:
        comp_name = placement.company.name if placement.company else "Industry Partner"
        role_name = placement.job_title or "Engineer"
        career_parts.append(f"Campus Placement Offer: {comp_name} as {role_name} ({placement.offer_type}).")
    if profile.bio:
        career_parts.append(f"Career Focus: {profile.bio.strip()}")
    career_text = " ".join(career_parts)

    metadata = {
        "user_id": user.id,
        "role": "STUDENT",
        "department_id": department.id if department else None,
        "department_code": department.code if department else None,
        "batch_id": batch.id if batch else None,
        "batch_period": f"{batch.start_year}-{batch.end_year}" if batch else None,
        "semester": profile.semester,
        "skills_count": len(user_skills),
        "has_resume": bool(has_resume),
        "is_active": bool(getattr(user, "is_active", True)),
    }

    facets = [
        {"chunk_type": "STUDENT_ACADEMIC", "chunk_index": 0, "text": academic_text},
        {"chunk_type": "STUDENT_SKILLS", "chunk_index": 0, "text": skills_text},
        {"chunk_type": "STUDENT_CAREER", "chunk_index": 0, "text": career_text},
    ]

    return {
        "user_id": user.id,
        "role": "STUDENT",
        "metadata": metadata,
        "facets": facets,
    }


def build_alumni_document(user: Any) -> Dict[str, Any]:
    """
    Extracts whitelisted alumni data and formats it into 4 distinct semantic facets:
    1. ALUMNI_CAREER
    2. ALUMNI_TECH_STACK
    3. ALUMNI_MENTOR
    4. ALUMNI_ACADEMIC
    Strictly excludes all PII.
    """
    profile = getattr(user, "alumni_profile", None)
    if not profile:
        raise ValueError(f"User #{user.id} has no AlumniProfile.")

    department = getattr(profile, "department", None)
    batch = getattr(profile, "batch", None)
    company = getattr(profile, "current_company", None)

    # 1. Group skills by proficiency level
    user_skills = list(user.user_skills.all()) if hasattr(user, "user_skills") else []
    skills_by_proficiency: Dict[str, List[str]] = {
        "ADVANCED": [],
        "INTERMEDIATE": [],
        "BEGINNER": [],
    }
    for us in user_skills:
        prof = us.proficiency if us.proficiency in skills_by_proficiency else "INTERMEDIATE"
        skill_name = us.skill.name if us.skill else ""
        if skill_name:
            skills_by_proficiency[prof].append(skill_name)

    # --- Facet 1: ALUMNI_CAREER ---
    career_parts = ["Alumni Professional Career Profile."]
    if company:
        tier_disp = company.get_company_tier_display() if hasattr(company, "get_company_tier_display") else company.company_tier
        career_parts.append(f"Current Employer: {company.name} (Tier: {tier_disp}).")
    if profile.current_job_title:
        career_parts.append(f"Current Role: {profile.current_job_title}.")
    if profile.job_category:
        cat_disp = profile.get_job_category_display() if hasattr(profile, "get_job_category_display") else profile.job_category
        career_parts.append(f"Domain Category: {cat_disp}.")
    if profile.years_of_experience:
        career_parts.append(f"Industry Experience: {profile.years_of_experience} Years.")
    if profile.location:
        career_parts.append(f"Location: {profile.location}.")
    if profile.bio:
        career_parts.append(f"Professional Bio: {profile.bio.strip()}")
    career_text = " ".join(career_parts)

    # --- Facet 2: ALUMNI_TECH_STACK ---
    tech_parts = ["Alumni Production Technology Stack and Expertise."]
    all_skills = (
        skills_by_proficiency["ADVANCED"]
        + skills_by_proficiency["INTERMEDIATE"]
        + skills_by_proficiency["BEGINNER"]
    )
    if skills_by_proficiency["ADVANCED"]:
        tech_parts.append(f"Production Core Skills: {', '.join(skills_by_proficiency['ADVANCED'])}.")
    if skills_by_proficiency["INTERMEDIATE"]:
        tech_parts.append(f"Proficient Technologies: {', '.join(skills_by_proficiency['INTERMEDIATE'])}.")
    if skills_by_proficiency["BEGINNER"]:
        tech_parts.append(f"Secondary Tools: {', '.join(skills_by_proficiency['BEGINNER'])}.")
    if not all_skills and profile.current_job_title:
        tech_parts.append(f"Specialized in enterprise {profile.current_job_title} technologies.")
    tech_text = " ".join(tech_parts)

    # --- Facet 3: ALUMNI_MENTOR ---
    mentor_parts = ["Alumni Mentorship Offerings and Guidance Areas."]
    job_title = profile.current_job_title or "Engineer"
    comp_name = company.name if company else "Tech Enterprise"
    mentor_parts.append(f"Available for career advice in {job_title} roles and corporate preparation for {comp_name}.")
    if profile.bio:
        mentor_parts.append(f"Mentorship Focus: {profile.bio.strip()}")
    mentor_text = " ".join(mentor_parts)

    # --- Facet 4: ALUMNI_ACADEMIC ---
    academic_parts = ["Alumni University Heritage and Academic Journey."]
    if department:
        academic_parts.append(f"Graduated from Department of {department.name} (Code: {department.code}).")
    if batch:
        academic_parts.append(f"Batch Period: {batch.start_year}-{batch.end_year} (Class of {batch.end_year}).")
    academic_text = " ".join(academic_parts)

    metadata = {
        "user_id": user.id,
        "role": "ALUMNI",
        "company_id": company.id if company else None,
        "company_name": company.name if company else None,
        "company_tier": company.company_tier if company else None,
        "job_category": profile.job_category,
        "department_id": department.id if department else None,
        "graduation_year": batch.end_year if batch else None,
        "experience_years": float(profile.years_of_experience) if profile.years_of_experience else 0.0,
        "is_active": bool(getattr(user, "is_active", True)),
    }

    facets = [
        {"chunk_type": "ALUMNI_CAREER", "chunk_index": 0, "text": career_text},
        {"chunk_type": "ALUMNI_TECH_STACK", "chunk_index": 0, "text": tech_text},
        {"chunk_type": "ALUMNI_MENTOR", "chunk_index": 0, "text": mentor_text},
        {"chunk_type": "ALUMNI_ACADEMIC", "chunk_index": 0, "text": academic_text},
    ]

    return {
        "user_id": user.id,
        "role": "ALUMNI",
        "metadata": metadata,
        "facets": facets,
    }


def build_user_document(user_or_id: Union[Any, int]) -> Dict[str, Any]:
    """
    Unified entry point for constructing user document representations.
    Validates profile readiness before building facets.
    """
    user = get_user_with_full_profile(user_or_id)
    ready, reason = is_profile_ready(user)
    if not ready:
        raise ValueError(f"User #{user.id} is not ready for vectorization: {reason}")

    if user.role == "STUDENT":
        return build_student_document(user)
    elif user.role == "ALUMNI":
        return build_alumni_document(user)
    else:
        raise ValueError(f"User #{user.id} has role '{user.role}', which does not use profile vectors.")
