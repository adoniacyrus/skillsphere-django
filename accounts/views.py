from django.contrib.auth import authenticate, login, logout
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated
from core.models import City 
from core.permissions import IsAdminRole
from .models import User

class RegisterUserView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginUserView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)

        if user is not None:
            login(request, user)  # 🔥 creates session
            return Response({
                "message": "Login successful",
                "user_id": user.id,
                "role": user.role
            }, status=status.HTTP_200_OK)

        return Response({
            "error": "Invalid credentials"
        }, status=status.HTTP_401_UNAUTHORIZED)
    
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        })
    
class LogoutUserView(APIView):
    def post(self, request):
        logout(request)
        return Response({"message": "Logged out successfully"})
    
class SetPreferredCityView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        city_id = request.data.get('city_id')

        if not city_id:
            return Response(
                {"error": "city_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            city = City.objects.get(id=city_id)
        except City.DoesNotExist:
            return Response(
                {"error": "Invalid city"},
                status=status.HTTP_404_NOT_FOUND
            )

        user = request.user
        user.preferred_city = city
        user.save()

        return Response(
            {"message": f"Preferred city set to {city.name}"},
            status=status.HTTP_200_OK
        )

class UserListView(ListAPIView):
    permission_classes = [IsAdminRole]
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset