# bookings/urls.py

from django.urls import path
from .views import CreateBookingView, MyBookingsView, OrganizerBookingsView, CancelBookingView, AllBookingsView

urlpatterns = [
    path('create/', CreateBookingView.as_view(), name='create-booking'),
    path('my-bookings/', MyBookingsView.as_view(), name='my-bookings'),
    path('organizer-bookings/', OrganizerBookingsView.as_view(), name='organizer-bookings'),
    path('all/', AllBookingsView.as_view(), name='all-bookings'),
    path('<int:pk>/cancel/', CancelBookingView.as_view(), name='cancel-booking'),
]