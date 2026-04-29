from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Village, Clinic, Specialist, AvailabilitySlot, Appointment


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('full_name', 'email', 'role', 'created_at')
    list_filter = ('role',)
    search_fields = ('full_name', 'email')
    ordering = ('-created_at',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations', {'fields': ('full_name', 'phone', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('email', 'full_name', 'role', 'password1', 'password2')}),
    )


@admin.register(Village)
class VillageAdmin(admin.ModelAdmin):
    list_display = ('name',)


@admin.register(Clinic)
class ClinicAdmin(admin.ModelAdmin):
    list_display = ('name', 'village', 'address', 'phone')
    list_filter = ('village',)


@admin.register(Specialist)
class SpecialistAdmin(admin.ModelAdmin):
    list_display = ('user', 'specialty', 'clinic')
    list_filter = ('specialty',)


@admin.register(AvailabilitySlot)
class AvailabilitySlotAdmin(admin.ModelAdmin):
    list_display = ('specialist', 'slot_date', 'start_time', 'end_time', 'status')
    list_filter = ('status', 'slot_date')


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'specialist', 'slot', 'status', 'created_at')
    list_filter = ('status',)
