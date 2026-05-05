from rest_framework import serializers
from .models import Workshop


class WorkshopSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)

    class Meta:
        model = Workshop
        fields = '__all__'
        read_only_fields = ['organizer', 'seats_available']

    def create(self, validated_data):
        # Set seats_available = seat_limit automatically
        validated_data['seats_available'] = validated_data['seat_limit']
        return super().create(validated_data)