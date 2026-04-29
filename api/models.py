from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class UserManager(BaseUserManager):
    def create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('Email requis')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [('patient', 'Patient'), ('specialist', 'Spécialiste'), ('admin', 'Admin')]

    full_name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = UserManager()

    def __str__(self):
        return self.full_name


class Village(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Clinic(models.Model):
    name = models.CharField(max_length=200)
    village = models.ForeignKey(Village, on_delete=models.CASCADE, related_name='clinics')
    address = models.CharField(max_length=300, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.name


class Specialist(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='specialist_profile')
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name='specialists')
    specialty = models.CharField(max_length=100)
    bio = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.full_name} — {self.specialty}"


class AvailabilitySlot(models.Model):
    STATUS_CHOICES = [('available', 'Disponible'), ('pending', 'En attente'), ('booked', 'Réservé')]

    specialist = models.ForeignKey(Specialist, on_delete=models.CASCADE, related_name='slots')
    slot_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')

    class Meta:
        unique_together = ('specialist', 'slot_date', 'start_time')

    def __str__(self):
        return f"{self.specialist} — {self.slot_date} {self.start_time}"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'), ('confirmed', 'Confirmé'),
        ('rejected', 'Refusé'), ('cancelled', 'Annulé'),
    ]

    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    specialist = models.ForeignKey(Specialist, on_delete=models.CASCADE, related_name='appointments')
    slot = models.ForeignKey(AvailabilitySlot, on_delete=models.CASCADE, related_name='appointments')
    reason = models.TextField()
    consultation_type = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient} → {self.specialist} ({self.status})"
