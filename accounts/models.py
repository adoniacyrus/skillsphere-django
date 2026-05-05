from django.contrib.auth.models import AbstractUser
from django.db import models
from core.models import City   # ✅ ADD THIS


class User(AbstractUser):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('organizer', 'Organizer'),
        ('admin', 'Admin'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')

    # ✅ NEW FIELD
    preferred_city = models.ForeignKey(
        City,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )

    def __str__(self):
        return self.username