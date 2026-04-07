from django.db import models
from accounts.models import User
from workshops.models import Workshop
from django.core.exceptions import ValidationError

class Booking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    workshop = models.ForeignKey(Workshop, on_delete=models.CASCADE)
    
    seats_booked = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    booked_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.seats_booked > self.workshop.seats_available:
            raise ValidationError("Not enough seats available")

        # Reduce available seats
        self.workshop.seats_available -= self.seats_booked
        self.workshop.save()

        # Calculate total price
        self.total_price = self.seats_booked * self.workshop.price

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user} - {self.workshop} ({self.seats_booked} seats)"