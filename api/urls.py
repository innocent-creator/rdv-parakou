from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register', views.auth_register),
    path('auth/login', views.auth_login),
    path('auth/me', views.auth_me),

    # Public
    path('communes', views.communes),
    path('communes/<int:pk>/villages', views.commune_villages),
    path('villages', views.villages),
    path('villages/<int:pk>/clinics', views.village_clinics),
    path('clinics/<int:pk>/specialists', views.clinic_specialists),
    path('specialists/<int:pk>/slots', views.specialist_slots_public),

    # Patient
    path('appointments', views.appointments_create),
    path('appointments/<int:pk>/cancel', views.appointment_cancel),
    path('appointments/<int:pk>/confirmation-pdf', views.appointment_confirmation_pdf),

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
    path('admin/specialists/<int:pk>/profile', views.admin_update_specialist),
    path('admin/clinics', views.admin_clinics),
    # Gestion des données (ajout communes / villages / cliniques)
    path('admin/data/communes', views.admin_communes_manage),
    path('admin/data/villages', views.admin_villages_manage),
    path('admin/data/clinics', views.admin_clinics_create),
]
