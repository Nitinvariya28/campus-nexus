import collections
from django.db.models import Count, Q
from apps.resumes.models import Resume, ResumeAnalysis

def get_personal_resume_analytics(user, resume_id=None):
    q_resume = Q(user=user)
    
    if resume_id:
        q_resume &= Q(id=resume_id)
        
    resumes = Resume.objects.filter(q_resume)
    resume_ids = resumes.values_list('id', flat=True)
    analyses = ResumeAnalysis.objects.filter(resume_id__in=resume_ids)
    
    total_resumes_uploaded = resumes.count()
    total_analyses_run = analyses.count()
    
    primary_resume = resumes.filter(is_primary=True).first()
    if not primary_resume and resumes.exists():
        primary_resume = resumes.order_by('-updated_at').first()
        
    primary_resume_id = primary_resume.id if primary_resume else None
    
    primary_resume_latest_score = None
    if primary_resume_id:
        latest_analysis = ResumeAnalysis.objects.filter(resume_id=primary_resume_id).order_by('-created_at').first()
        if latest_analysis and latest_analysis.score:
            primary_resume_latest_score = float(latest_analysis.score)

    score_progression = list(
        analyses.filter(score__isnull=False)
        .order_by('created_at')
        .values('resume_id', 'id', 'created_at', 'score')
    )
    
    # Rename id to analysis_id
    for sp in score_progression:
        sp['analysis_id'] = sp.pop('id')
        sp['score'] = float(sp['score'])
        
    # Aggregate feedback
    missing_skills_counter = collections.Counter()
    strengths_counter = collections.Counter()
    
    for analysis in analyses:
        if analysis.missing_skills:
            for skill in analysis.missing_skills:
                missing_skills_counter[skill] += 1
        if analysis.strengths:
            for strength in analysis.strengths:
                strengths_counter[strength] += 1
                
    frequently_missing_skills = [{"skill": k, "flagged_count": v} for k, v in missing_skills_counter.most_common(10)]
    consistent_strengths = [{"strength": k, "flagged_count": v} for k, v in strengths_counter.most_common(10)]
    
    latest_detailed_analysis = None
    overall_latest = analyses.order_by('-created_at').first()
    if overall_latest:
        latest_detailed_analysis = {
            "analysis_id": overall_latest.id,
            "score": float(overall_latest.score) if overall_latest.score else None,
            "suggestions": overall_latest.suggestions or []
        }

    return {
        "resume_overview": {
            "total_resumes_uploaded": total_resumes_uploaded,
            "total_analyses_run": total_analyses_run,
            "primary_resume_id": primary_resume_id,
            "primary_resume_latest_score": primary_resume_latest_score
        },
        "score_progression": score_progression,
        "aggregated_feedback": {
            "frequently_missing_skills": frequently_missing_skills,
            "consistent_strengths": consistent_strengths
        },
        "latest_detailed_analysis": latest_detailed_analysis
    }
