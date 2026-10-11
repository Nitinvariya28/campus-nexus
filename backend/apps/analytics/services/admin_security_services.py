from django.db.models import Count, Q
from apps.accounts.models import OTPVerification, User
from apps.university.models import UniversityIdentity
from django.utils import timezone

def get_admin_security_analytics(filters):
    threshold = int(filters.get('threshold', 10))
    
    q_otp = Q()
    date_from = filters.get('date_from')
    date_to = filters.get('date_to')
    
    if date_from:
        q_otp &= Q(created_at__gte=date_from)
    if date_to:
        q_otp &= Q(created_at__lte=date_to)
        
    emails_above_threshold = list(
        OTPVerification.objects.filter(q_otp)
        .values('email')
        .annotate(request_count=Count('id'))
        .filter(request_count__gte=threshold)
        .order_by('-request_count')
    )
    
    # Needs to get latest request for each. We can just add it in python.
    for e in emails_above_threshold:
        latest = OTPVerification.objects.filter(email=e['email']).order_by('-created_at').first()
        e['latest_request'] = latest.created_at.isoformat() if latest else None

    # Identity Claiming
    total_pre_approved = UniversityIdentity.objects.count()
    
    # We find how many identities are claimed by joining with User by email
    identities_claimed = UniversityIdentity.objects.filter(
        university_email__in=User.objects.values('email')
    ).count()
    
    identities_unclaimed = total_pre_approved - identities_claimed
    claim_rate_percentage = round((identities_claimed / total_pre_approved * 100), 1) if total_pre_approved > 0 else 0.0

    return {
        "otp_abuse_detection": {
            "emails_above_threshold": emails_above_threshold
        },
        "identity_claiming": {
            "total_pre_approved_identities": total_pre_approved,
            "identities_claimed": identities_claimed,
            "identities_unclaimed": identities_unclaimed,
            "claim_rate_percentage": claim_rate_percentage
        }
    }
