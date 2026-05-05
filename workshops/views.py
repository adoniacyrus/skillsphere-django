from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from .models import Workshop
from .serializers import WorkshopSerializer
from .permissions import IsOrganizerOrReadOnly, IsAdminUserCustom, IsOwnerOrganizerOrReadOnly

class WorkshopPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class WorkshopListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkshopSerializer
    permission_classes = [IsOrganizerOrReadOnly]
    pagination_class = WorkshopPagination

    def get_queryset(self):
        user = self.request.user
        
        if user.is_authenticated and user.role == 'admin':
            queryset = Workshop.objects.all().order_by('-date')
        elif user.is_authenticated and user.role == 'organizer':
            # Organizers see approved workshops AND their own pending workshops
            queryset = Workshop.objects.filter(Q(is_approved=True) | Q(organizer=user)).order_by('-date')
        else:
            queryset = Workshop.objects.filter(is_approved=True).order_by('-date')

        city = self.request.query_params.get('city')
        search = self.request.query_params.get('search')
        sort = self.request.query_params.get('sort')

        # ✅ Search by title
        if search:
            queryset = queryset.filter(title__icontains=search)

        # ✅ Priority 1: Query param (user actively selects)
        if city:
            queryset = queryset.filter(city__name__iexact=city)
        else:
            # ✅ Priority 2: User preferred city
            user = self.request.user
            if user.is_authenticated and user.preferred_city:
                queryset = queryset.filter(city=user.preferred_city)

        # ✅ Sorting
        if sort in ['price', '-price', 'date', '-date']:
            queryset = queryset.order_by(sort)

        return queryset

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)


class WorkshopDetailView(generics.RetrieveUpdateAPIView):
    queryset = Workshop.objects.all()
    serializer_class = WorkshopSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrganizerOrReadOnly]


class WorkshopApproveView(generics.UpdateAPIView):
    queryset = Workshop.objects.all()
    serializer_class = WorkshopSerializer
    permission_classes = [IsAdminUserCustom]

    def patch(self, request, *args, **kwargs):
        workshop = self.get_object()
        workshop.is_approved = True
        workshop.save()
        return Response(
            {"message": "Workshop approved"},
            status=status.HTTP_200_OK
        )