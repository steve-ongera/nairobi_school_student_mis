"""
core/permissions.py – Role-based permission classes for the School MIS.

Usage in views:
    permission_classes = [IsAuthenticated, IsAdmin]
    permission_classes = [IsAuthenticated, IsTeacher | IsAdmin]
"""

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to users with the 'admin' role."""
    message = "You must be an administrator to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsTeacher(BasePermission):
    """Allow access only to users with the 'teacher' role."""
    message = "You must be a teacher to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "teacher"
        )


class IsStudent(BasePermission):
    """Allow access only to users with the 'student' role."""
    message = "You must be a student to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "student"
        )


class IsParent(BasePermission):
    """Allow access only to users with the 'parent' role."""
    message = "You must be a parent/guardian to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "parent"
        )


class IsFinance(BasePermission):
    """Allow access only to users with the 'finance' role."""
    message = "You must be a finance officer to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "finance"
        )


class IsAdminOrFinance(BasePermission):
    """Allow access to admin or finance officers."""
    message = "You must be an administrator or finance officer."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("admin", "finance")
        )


class IsAdminOrTeacher(BasePermission):
    """Allow access to admin or teachers."""
    message = "You must be an administrator or teacher."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("admin", "teacher")
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission: allow the owner of a resource or an admin.
    The view must pass `obj` to `has_object_permission`.
    Convention: obj must have a `user` attribute or be a User instance.
    """
    message = "You do not have permission to access this resource."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        # obj is a User
        if hasattr(obj, "pk") and obj.pk == request.user.pk:
            return True
        # obj has a user attribute (Student, Teacher, etc.)
        if hasattr(obj, "user") and obj.user == request.user:
            return True
        return False


class IsAllocatedTeacher(BasePermission):
    """
    Object-level permission for marks entry:
    a teacher can only enter marks for subjects/classrooms allocated to them.
    Evaluated in the view, not here, but this class provides the base check.
    """
    message = "You are not allocated to this subject or classroom."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("teacher", "admin")
        )


class ReadOnly(BasePermission):
    """Allow read-only (GET, HEAD, OPTIONS) to any authenticated user."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.method in ("GET", "HEAD", "OPTIONS")
        )