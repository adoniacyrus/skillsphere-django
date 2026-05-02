from django.shortcuts import render
from rest_framework import generics, permissions
from .models import Workshop
from .serializers import WorkshopSerializer
from .permissions import IsOrganizerOrReadOnly

class WorkshopListCreateView(generics.ListCreateAPIView):
    queryset = Workshop.objects.all()
    serializer_class = WorkshopSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

class WorkshopListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkshopSerializer
    permission_classes = [IsOrganizerOrReadOnly]

    def get_queryset(self):
        queryset = Workshop.objects.filter(is_approved=True)
        city_id = self.request.query_params.get('city')

        if city_id:
            queryset = queryset.filter(city_id=city_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

class WorkshopDetailView(generics.RetrieveAPIView):
    queryset = Workshop.objects.all()
    serializer_class = WorkshopSerializer
    permission_classes = [permissions.IsAuthenticated]

