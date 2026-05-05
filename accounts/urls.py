from django.urls import path
from .views import RegisterUserView
from .views import LoginUserView
from .views import CurrentUserView
from .views import LogoutUserView
from .views import SetPreferredCityView
from .views import UserListView

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', LoginUserView.as_view()),
    path('me/', CurrentUserView.as_view()),
    path('logout/', LogoutUserView.as_view()),
    path('set-city/', SetPreferredCityView.as_view(), name='set-city'),
    path('users/', UserListView.as_view(), name='user-list'),
]