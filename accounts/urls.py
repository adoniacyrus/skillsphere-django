from django.urls import path
from .views import RegisterUserView
from .views import LoginUserView
from .views import CurrentUserView
from .views import LogoutUserView

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', LoginUserView.as_view()),
    path('me/', CurrentUserView.as_view()),
    path('logout/', LogoutUserView.as_view()),
]