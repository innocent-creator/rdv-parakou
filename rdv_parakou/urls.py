from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('', TemplateView.as_view(template_name='index.html')),
    path('patient', TemplateView.as_view(template_name='patient.html')),
    path('specialist', TemplateView.as_view(template_name='specialist.html')),
    path('admin-panel', TemplateView.as_view(template_name='admin.html')),
    path('admin-login', TemplateView.as_view(template_name='admin_login.html')),
]
