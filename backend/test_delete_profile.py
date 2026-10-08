import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.skills.models import SkillCategory, UserSkill

User = get_user_model()
client = APIClient(SERVER_NAME='localhost')

user = User.objects.filter(email='delete_test@nirmauni.ac.in').first()
if user:
    client.force_authenticate(user=user)
    res = client.delete('/api/profiles/me/', HTTP_HOST='localhost')
    print(f'API RESPONSE STATUS: {res.status_code}')
    if hasattr(res, 'data'): print(res.data)
    user.refresh_from_db()
    print(f'AFTER DELETE: User active={user.is_active}, Skills={UserSkill.objects.filter(user=user).count()}, Email={user.email}, Name={user.first_name} {user.last_name}')

