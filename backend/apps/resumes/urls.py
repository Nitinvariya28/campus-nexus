from django.urls import path
from .views import (
    ResumeListUploadView,
    SetPrimaryResumeView,
    ResumeDetailDeleteView,
)

urlpatterns = [
    path('', ResumeListUploadView.as_view(), name='resume-list-upload'),
    path('<int:resume_id>/', ResumeDetailDeleteView.as_view(), name='resume-detail-delete'),
    path('<int:resume_id>/set-primary/', SetPrimaryResumeView.as_view(), name='resume-set-primary'),
]
