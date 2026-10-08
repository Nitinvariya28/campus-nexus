import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()
client = APIClient()

# Pick a test user
user = User.objects.first()

# Generate tokens for user manually (to simulate login)
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)
refresh_token = str(refresh)

print('--- TESTING LOGOUT API ---')
print('User:', user.email)

# 1. Try hitting a protected endpoint with the access token
client.credentials(HTTP_AUTHORIZATION='Bearer ' + access_token)
res1 = client.get('/api/profiles/me/')
print('[BEFORE LOGOUT] GET /api/profiles/me/ -> STATUS:', res1.status_code)

# 2. Logout
payload = {'refresh': refresh_token}
logout_res = client.post('/api/auth/logout/', payload, format='json')
print('[LOGOUT] POST /api/auth/logout/ -> STATUS:', logout_res.status_code, logout_res.data)

# 3. Try to use the refresh token again (simulating malicious reuse or double logout)
logout_res2 = client.post('/api/auth/logout/', payload, format='json')
print('[LOGOUT AGAIN] POST /api/auth/logout/ -> STATUS:', logout_res2.status_code, logout_res2.data)

# We can also prove the token is in the BlacklistedToken model
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
print('Total Blacklisted Tokens in DB:', BlacklistedToken.objects.count())

