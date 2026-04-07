from django.db import models
from accounts.models import User
from workshops.models import Workshop

class Booking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    workshop = models.ForeignKey(Workshop, on_delete=models.CASCADE)
    
    seats_booked = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    booked_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Calculate total price automatically
        self.total_price = self.seats_booked * self.workshop.price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user} - {self.workshop} ({self.seats_booked} seats)"