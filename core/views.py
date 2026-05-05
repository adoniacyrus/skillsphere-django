from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import AllowAny
from .models import City
from .serializers import CitySerializer
from core.permissions import IsAdminRole

class CityListView(ListCreateAPIView):
    serializer_class = CitySerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = City.objects.all()

        search = self.request.query_params.get('search')

        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset