from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from .models import Booking
from .serializers import BookingSerializer
from workshops.models import Workshop
from rest_framework.generics import ListAPIView
from core.permissions import IsUserRole, IsOrganizerRole, IsAdminRole


class CreateBookingView(APIView):
    permission_classes = [IsUserRole]
    def post(self, request):
        serializer = BookingSerializer(data=request.data)

        if serializer.is_valid():
            workshop_id = serializer.validated_data['workshop'].id
            seats_requested = serializer.validated_data['seats_booked']

            try:
                with transaction.atomic():

                    # 🔒 Lock the workshop row
                    workshop = Workshop.objects.select_for_update().get(id=workshop_id)

                    # ❗ Check seat availability safely
                    if seats_requested > workshop.seats_available:
                        return Response(
                            {"error": "Not enough seats available"},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # 🛑 Prevent duplicate bookings
                    if Booking.objects.filter(user=request.user, workshop=workshop).exists():
                        return Response(
                            {"error": "You have already booked this workshop."},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # 💰 Calculate price
                    total_price = seats_requested * workshop.price

                    # ➖ Deduct seats
                    workshop.seats_available -= seats_requested
                    workshop.save()

                    # 📌 Create booking
                    booking = Booking.objects.create(
                        user=request.user,
                        workshop=workshop,
                        seats_booked=seats_requested,
                        total_price=total_price
                    )

                    return Response(
                        BookingSerializer(booking).data,
                        status=status.HTTP_201_CREATED
                    )

            except Workshop.DoesNotExist:
                return Response(
                    {"error": "Workshop not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class MyBookingsView(ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsUserRole]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).order_by('-booked_at')
    
class OrganizerBookingsView(ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsOrganizerRole]

    def get_queryset(self):
        return Booking.objects.filter(
            workshop__organizer=self.request.user
        ).order_by('-booked_at')

class CancelBookingView(APIView):
    permission_classes = [IsUserRole]

    def delete(self, request, pk):
        try:
            with transaction.atomic():
                # 🔍 Find booking and lock workshop row to safely restore seats
                booking = Booking.objects.select_related('workshop').get(id=pk, user=request.user)
                workshop = Workshop.objects.select_for_update().get(id=booking.workshop.id)

                # ➕ Restore seats
                workshop.seats_available += booking.seats_booked
                workshop.save()

                # 🗑️ Delete booking
                booking.delete()

                return Response(
                    {"message": "Booking cancelled successfully."},
                    status=status.HTTP_200_OK
                )
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found or you do not have permission to cancel it."},
                status=status.HTTP_404_NOT_FOUND
            )

class AllBookingsView(ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return Booking.objects.all().order_by('-booked_at')