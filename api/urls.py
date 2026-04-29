from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register', views.auth_register),
    path('auth/login', views.auth_login),
    path('auth/me', views.auth_me),

    # Public
    path('villages', views.villages),
    path('villages/<int:pk>/clinics', views.village_clinics),
    path('clinics/<int:pk>/specialists', views.clinic_specialists),
    path('specialists/<int:pk>/slots', views.specialist_slots_public),

    # Patient
    path('appointments', views.appointments_create),
    path('appointments/mine', views.appointments_mine),
    path('appointments/<int:pk>/cancel', views.appointment_cancel),

    # Specialist
    path('specialist/me', views.specialist_profile),
    path('specialist/slots', views.specialist_slots),
    path('specialist/slots/<int:pk>', views.specialist_slot_delete),
    path('specialist/appointments', views.specialist_appointments),
    path('specialist/appointments/<int:pk>/confirm', views.specialist_appointment_confirm),
    path('specialist/appointments/<int:pk>/reject', views.specialist_appointment_reject),

    # Admin
    path('admin/stats', views.admin_stats),
    path('admin/patients', views.admin_patients),
    path('admin/specialists', views.admin_specialists),
    path('admin/users/<int:pk>', views.admin_delete_user),
    path('admin/clinics', views.admin_clinics),
]
