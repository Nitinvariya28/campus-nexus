from django.urls import path
from .views import (
    ReportCreateListView,
    ReportDetailManageView,
)

urlpatterns = [
    path('', ReportCreateListView.as_view(), name='report-create-list'),
    path('<int:report_id>/', ReportDetailManageView.as_view(), name='report-detail-manage'),
]
