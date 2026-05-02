from django.conf import settings
from django.db import models
from workshops.models import Workshop


class Booking(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    workshop = models.ForeignKey(
        Workshop,
        on_delete=models.CASCADE,
        related_name='bookings'
    )

    seats_booked = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    booked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.workshop} ({self.seats_booked} seats)"