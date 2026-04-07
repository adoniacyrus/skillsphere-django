from django.db import models
from accounts.models import User
from core.models import City

class Workshop(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    organizer = models.ForeignKey(User, on_delete=models.CASCADE)
    city = models.ForeignKey(City, on_delete=models.CASCADE)
    date = models.DateTimeField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    seat_limit = models.IntegerField()
    seats_available = models.IntegerField()

    def __str__(self):
        return self.title