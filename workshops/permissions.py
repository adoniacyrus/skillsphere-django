from rest_framework import permissions


class IsOrganizerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow GET requests for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True

        # Allow POST only if user is an organizer
        return request.user.role == 'organizer'