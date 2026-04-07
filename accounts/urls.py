from django.urls import path
from .views import RegisterUserView
from .views import LoginUserView

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', LoginUserView.as_view()),
]