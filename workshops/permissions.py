from rest_framework import permissions


class IsOrganizerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow GET requests for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True

        # Allow POST only if user is an organizer
        return request.user.role == 'organizer'
    
class IsAdminUserCustom(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'admin'

class IsOwnerOrganizerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Allow GET requests for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the organizer of the workshop
        return request.user.is_authenticated and request.user.role == 'organizer' and obj.organizer == request.user