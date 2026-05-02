from rest_framework import serializers
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['id', 'workshop', 'seats_booked', 'total_price', 'booked_at']
        read_only_fields = ['id', 'total_price', 'booked_at']

    def validate_seats_booked(self, value):
        if value <= 0:
            raise serializers.ValidationError("Seats must be at least 1")
        return value