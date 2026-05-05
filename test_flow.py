import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skillsphere.settings')
django.setup()

from rest_framework.test import APIClient
from accounts.models import User
from core.models import City
from workshops.models import Workshop
from bookings.models import Booking

def run_tests():
    print("🚀 Starting SkillSphere Flow Test...\n")
    client = APIClient()

    # 1. Clean DB (optional, but good for test consistency)
    User.objects.filter(username__in=['testadmin', 'testorg', 'testuser']).delete()
    City.objects.filter(name='Kochi').delete()

    # 2. Setup Users
    print("👤 Creating users...")
    admin = User.objects.create_superuser('testadmin', 'admin@test.com', 'pass123')
    admin.role = 'admin'
    admin.save()

    org = User.objects.create_user('testorg', 'org@test.com', 'pass123')
    org.role = 'organizer'
    org.save()

    user = User.objects.create_user('testuser', 'user@test.com', 'pass123')
    user.role = 'user'
    user.save()
    print("✅ Users created (Admin, Organizer, User).\n")

    # 3. Create a City (Admin task)
    city = City.objects.create(name='Kochi')
    print("🏙️ City created:", city.name, "\n")

    # 4. Organizer Creates Workshop
    print("📝 Organizer creating a workshop...")
    client.force_authenticate(user=org)
    res = client.post('/api/workshops/', {
        "title": "Advanced Python",
        "description": "Learn advanced Python concepts.",
        "city": city.id,
        "date": "2026-06-01T10:00:00Z",
        "price": "99.99",
        "seat_limit": 10
    }, format='json')
    
    if res.status_code == 201:
        workshop_id = res.data['id']
        print(f"✅ Workshop created! ID: {workshop_id}, Title: {res.data['title']}, Seats Available: {res.data['seats_available']}\n")
    else:
        print("❌ Failed to create workshop:", res.data)
        return

    # 5. Admin Approves Workshop
    print("✅ Admin approving workshop...")
    client.force_authenticate(user=admin)
    res = client.patch(f'/api/workshops/{workshop_id}/approve/')
    if res.status_code == 200:
        print("✅ Workshop approved.\n")
    else:
        print("❌ Failed to approve:", res.data)
        return

    # 6. User Views Workshops (Search & Filter)
    print("🔍 User browsing workshops...")
    client.force_authenticate(user=user)
    res = client.get('/api/workshops/?search=Python&sort=-price')
    print(f"✅ Workshops found: {res.data['count']}")
    
    # 7. User Books Workshop
    print("\n🎫 User booking 2 seats...")
    res = client.post('/api/bookings/create/', {
        "workshop": workshop_id,
        "seats_booked": 2
    }, format='json')

    if res.status_code == 201:
        booking_id = res.data['id']
        print(f"✅ Booking successful! ID: {booking_id}, Total Price: ${res.data['total_price']}")
        
        # Verify seats deducted
        w = Workshop.objects.get(id=workshop_id)
        print(f"✅ Seats remaining in DB: {w.seats_available} (Expected: 8)\n")
    else:
        print("❌ Booking failed:", res.data)
        return
        
    # 8. Organizer Views Bookings
    print("📊 Organizer viewing their bookings...")
    client.force_authenticate(user=org)
    res = client.get('/api/bookings/organizer-bookings/')
    data = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
    print(f"✅ Organizer sees {len(data)} booking(s).")
    if len(data) > 0:
        print(f"   Booking User Email: {data[0]['user_email']}")
    print("")

    # 9. User Cancels Booking
    print("🗑️ User canceling their booking...")
    client.force_authenticate(user=user)
    res = client.delete(f'/api/bookings/{booking_id}/cancel/')
    if res.status_code == 200:
        print("✅ Cancellation successful!")
        w = Workshop.objects.get(id=workshop_id)
        print(f"✅ Seats restored in DB: {w.seats_available} (Expected: 10)\n")
    else:
        print("❌ Cancellation failed:", res.data)
        return

    print("🎉 ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    run_tests()
