import os, django, json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
User = get_user_model()
client = APIClient()

roles = ['STUDENT', 'ALUMNI', 'PLACEMENT_CELL']
for role in roles:
    user = User.objects.filter(role=role).first()
    print('--- TESTING', role, '---')
    client.force_authenticate(user=user)
    get_res = client.get('/api/profiles/me/')
    print('[GET]', get_res.status_code)
    if get_res.status_code != 200: print(get_res.data)
    payload = {}
    if role == 'STUDENT': payload = {'identity': {'bio': 'Student Bio'}, 'skills': [{'skill_id': 1, 'proficiency': 'ADVANCED'}]}
    elif role == 'ALUMNI': payload = {'identity': {'bio': 'Alumni Bio'}, 'current_career': {'role': 'CTO'}}
    elif role == 'PLACEMENT_CELL': payload = {'identity': {'full_name': 'Nirma Placement'}}
    patch_res = client.patch('/api/profiles/me/', payload, format='json')
    print('[PATCH]', patch_res.status_code)
    if patch_res.status_code != 200: print(patch_res.data)

