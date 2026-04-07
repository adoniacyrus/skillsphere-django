from django.urls import path
from .views import WorkshopListCreateView

urlpatterns = [
    path('', WorkshopListCreateView.as_view(), name='workshop-list-create'),
]