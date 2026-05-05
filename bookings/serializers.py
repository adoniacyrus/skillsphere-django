from rest_framework import serializers
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    workshop_title = serializers.CharField(source='workshop.title', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id',
            'workshop',
            'workshop_title',
            'user_email',
            'seats_booked',
            'total_price',
            'booked_at'
        ]
        read_only_fields = ['id', 'total_price', 'booked_at', 'workshop_title', 'user_email']

    def validate_seats_booked(self, value):
        if value <= 0:
            raise serializers.ValidationError("Seats must be at least 1")
        return value