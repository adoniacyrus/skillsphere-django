from django.shortcuts import render
from rest_framework import generics, permissions
from .models import Workshop
from .serializers import WorkshopSerializer


class WorkshopListCreateView(generics.ListCreateAPIView):
    queryset = Workshop.objects.all()
    serializer_class = WorkshopSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)