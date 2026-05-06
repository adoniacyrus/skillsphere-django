"""
URL configuration for skillsphere project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.http import FileResponse, Http404
from django.conf import settings
from django.conf.urls.static import static
import os



def frontend_serve(request, path=''):
    if not path:
        path = 'index.html'
    
    file_path = os.path.join(settings.BASE_DIR, 'frontend', path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(open(file_path, 'rb'))
    raise Http404("Frontend file not found")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/workshops/', include('workshops.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/', include('core.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    # Catch-all to serve frontend HTML/JS/CSS directly
    re_path(r'^(?!static/|media/|admin/|api/)(?P<path>.*)$', frontend_serve),
]
