from django.urls import path
from .views import WorkshopListCreateView, WorkshopDetailView

urlpatterns = [
    path('', WorkshopListCreateView.as_view(), name='workshop-list-create'),
     path('<int:pk>/', WorkshopDetailView.as_view(), name='workshop-detail'),
]