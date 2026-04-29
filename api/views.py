from datetime import date
from django.db import transaction, IntegrityError
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import AccessToken

from .models import User, Village, Clinic, Specialist, AvailabilitySlot, Appointment


def _token(user):
    t = AccessToken.for_user(user)
    t['role'] = user.role
    t['full_name'] = user.full_name
    t['email'] = user.email
    return str(t)


def _user_dict(user):
    return {'id': user.id, 'full_name': user.full_name, 'email': user.email, 'role': user.role}


def _slot_dict(s):
    return {
        'id': s.id,
        'slot_date': str(s.slot_date),
        'start_time': str(s.start_time),
        'end_time': str(s.end_time),
        'status': s.status,
    }


# ── AUTH ──────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def auth_register(request):
    d = request.data
    full_name = (d.get('full_name') or '').strip()
    email = (d.get('email') or '').strip()
    phone = (d.get('phone') or '').strip() or None
    password = d.get('password') or ''
    if not full_name or not email or not password:
        return JsonResponse({'error': 'Champs requis manquants'}, status=400)
    if User.objects.filter(email=email).exists():
        return JsonResponse({'error': 'Email déjà utilisé'}, status=409)
    user = User.objects.create_user(
        email=email, password=password, full_name=full_name, phone=phone, role='patient'
    )
    return JsonResponse({'token': _token(user), 'user': _user_dict(user)})


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_login(request):
    d = request.data
    email = d.get('email') or ''
    password = d.get('password') or ''
    if not email or not password:
        return JsonResponse({'error': 'Email et mot de passe requis'}, status=400)
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Identifiants incorrects'}, status=401)
    if not user.check_password(password):
        return JsonResponse({'error': 'Identifiants incorrects'}, status=401)
    return JsonResponse({'token': _token(user), 'user': _user_dict(user)})


@api_view(['GET'])
def auth_me(request):
    return JsonResponse({'user': _user_dict(request.user)})


# ── PUBLIC ────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def villages(request):
    data = list(Village.objects.order_by('name').values('id', 'name'))
    return JsonResponse(data, safe=False)


@api_view(['GET'])
@permission_classes([AllowAny])
def village_clinics(request, pk):
    data = list(
        Clinic.objects.filter(village_id=pk).order_by('name').values('id', 'name', 'address', 'phone')
    )
    return JsonResponse(data, safe=False)


@api_view(['GET'])
@permission_classes([AllowAny])
def clinic_specialists(request, pk):
    today = date.today()
    result = []
    for s in Specialist.objects.filter(clinic_id=pk).select_related('user').order_by('user__full_name'):
        free = AvailabilitySlot.objects.filter(
            specialist=s, status='available', slot_date__gte=today
        ).count()
        result.append({
            'id': s.id, 'specialty': s.specialty, 'bio': s.bio,
            'full_name': s.user.full_name, 'email': s.user.email,
            'free_slots': free,
        })
    return JsonResponse(result, safe=False)


@api_view(['GET'])
@permission_classes([AllowAny])
def specialist_slots_public(request, pk):
    today = date.today()
    slots = AvailabilitySlot.objects.filter(
        specialist_id=pk, slot_date__gte=today
    ).order_by('slot_date', 'start_time')
    return JsonResponse([_slot_dict(s) for s in slots], safe=False)


# ── PATIENT ───────────────────────────────────────────────────────────────────

@api_view(['POST'])
def appointments_create(request):
    if request.user.role != 'patient':
        return JsonResponse({'error': 'Accès refusé'}, status=403)
    d = request.data
    slot_id = d.get('slot_id')
    reason = (d.get('reason') or '').strip()
    ctype = (d.get('consultation_type') or '').strip()
    if not slot_id or not reason or not ctype:
        return JsonResponse({'error': 'Champs requis manquants'}, status=400)
    try:
        slot = AvailabilitySlot.objects.get(id=slot_id)
    except AvailabilitySlot.DoesNotExist:
        return JsonResponse({'error': 'Créneau introuvable'}, status=404)
    if slot.status != 'available':
        return JsonResponse({'error': 'Créneau non disponible'}, status=409)
    with transaction.atomic():
        slot.status = 'pending'
        slot.save()
        apt = Appointment.objects.create(
            patient=request.user, specialist=slot.specialist, slot=slot,
            reason=reason, consultation_type=ctype, status='pending',
        )
    return JsonResponse({'id': apt.id, 'message': 'Demande envoyée.'})


@api_view(['GET'])
def appointments_mine(request):
    if request.user.role != 'patient':
        return JsonResponse({'error': 'Accès refusé'}, status=403)
    apts = (
        Appointment.objects
        .filter(patient=request.user)
        .select_related('specialist__user', 'specialist__clinic', 'slot')
        .order_by('-slot__slot_date', '-slot__start_time')
    )
    data = [{
        'id': a.id, 'status': a.status, 'reason': a.reason,
        'consultation_type': a.consultation_type,
        'specialty': a.specialist.specialty,
        'specialist_name': a.specialist.user.full_name,
        'clinic_name': a.specialist.clinic.name,
        'slot_date': str(a.slot.slot_date),
        'start_time': str(a.slot.start_time),
        'end_time': str(a.slot.end_time),
    } for a in apts]
    return JsonResponse(data, safe=False)


@api_view(['POST'])
def appointment_cancel(request, pk):
    if request.user.role != 'patient':
        return JsonResponse({'error': 'Accès refusé'}, status=403)
    try:
        apt = Appointment.objects.get(id=pk, patient=request.user)
    except Appointment.DoesNotExist:
        return JsonResponse({'error': 'Rendez-vous introuvable'}, status=404)
    if apt.status in ('cancelled', 'rejected'):
        return JsonResponse({'error': 'Déjà annulé'}, status=400)
    with transaction.atomic():
        apt.status = 'cancelled'
        apt.save()
        apt.slot.status = 'available'
        apt.slot.save()
    return JsonResponse({'ok': True})


# ── SPECIALIST ────────────────────────────────────────────────────────────────

def _get_specialist(user, res):
    try:
        return Specialist.objects.get(user=user)
    except Specialist.DoesNotExist:
        res['_error'] = ('Profil spécialiste introuvable', 404)
        return None


@api_view(['GET'])
def specialist_profile(request):
    if request.user.role != 'specialist':
        return JsonResponse({'error': 'Accès refusé'}, status=403)
    try:
        sp = Specialist.objects.select_related('user', 'clinic__village').get(user=request.user)
    except Specialist.DoesNotExist:
        return JsonResponse({'error': 'Profil introuvable'}, status=404)
    return JsonResponse({
        'id': sp.id, 'specialty': sp.specialty, 'bio': sp.bio,
        'full_name': sp.user.full_name, 'email': sp.user.email,
        'clinic_name': sp.clinic.name, 'village_name': sp.clinic.village.name,
    })


@api_view(['GET', 'POST'])
def specialist_slots(request):
    if request.user.role != 'specialist':
        return JsonResponse({'error': 'Accès refusé'}, status=403)
    try:
        sp = Specialist.objects.get(user=request.user)
    except Specialist.DoesNotExist:
        return JsonResponse({'error': 'Profil spécialiste introuvable'}, status=404)

    if request.method == 'GET':
        slots = sp.slots.order_by('-slot_date', 'start_time')
        return JsonResponse([_slot_dict(s) for s in slots], safe=False)

    d = request.data
    slot_date = d.get('slot_date')
    start_time = d.get('start_time')
    end_time = d.get('end_time')
    if not slot_date or not start_time or not end_time:
        return JsonResponse({'error': 'Champs requis'}, status=400)
    try:
        slot = AvailabilitySlot.objects.create(
            specialist=sp, slot_date=slot_date,
            start_time=start_time, end_time=end_time, status='available',
        )
        return JsonResponse({'id': slot.id})
    except IntegrityError:
        return JsonResponse({'error': 'Ce créneau existe déjà'}, status=409)


@api_view(['DELETE'])
def specialist_slot_delete(request, pk):
    if request.user.role != 'specialist':
        return JsonResponse({'error': 'Accès refusé'}, status=403)
    try:
        sp = Specialist.objects.get(user=request.user)
    except Specialist.DoesNotExist:
        return JsonResponse({'error': 'Profil spécialiste introuvable'}, status=404)
    try:
        slot = AvailabilitySlot.objects.get(id=pk, specialist=sp)
    except AvailabilitySlot.DoesNotExist:
        return JsonResponse({'error': 'Créneau introuvable'}, status=404)
    if slot.status == 'booked':
        return JsonResponse({'error': 'Créneau réservé'}, status=400)
    slot.delete()
    return JsonResponse({'ok': True})


@api_view(['GET'])
def specialist_appointments(request):
    if request.user.role != 'specialist':
        return JsonResponse({'error': 'Accès refusé'}, status=403)
    try:
        sp = Specialist.objects.get(user=request.user)
    except Specialist.DoesNotExist:
        return JsonResponse({'error': 'Profil spécialiste introuvable'}, status=404)
    apts = (
        Appointment.objects
        .filter(specialist=sp)
        .select_related('patient', 'slot')
        .order_by('-slot__slot_date', '-slot__start_time')
    )
    data = [{
        'id': a.id, 'status': a.status, 'reason': a.reason,
        'consultation_type': a.consultation_type,
        'patient_name': a.patient.full_name,
        'patient_email': a.patient.email,
        'patient_phone': a.patient.phone,
        'slot_date': str(a.slot.slot_date),
        'start_time': str(a.slot.start_time),
        'end_time': str(a.slot.end_time),
    } for a in apts]
    return JsonResponse(data, safe=False)


@api_view(['POST'])
def specialist_appointment_confirm(request, pk):
    if request.user.role != 'specialist':
        return JsonResponse({'error': 'Accès refusé'}, status=403)
    try:
        sp = Specialist.objects.get(user=request.user)
        apt = Appointment.objects.get(id=pk, specialist=sp)
    except (Specialist.DoesNotExist, Appointment.DoesNotExist):
        return JsonResponse({'error': 'Rendez-vous introuvable'}, status=404)
    if apt.status != 'pending':
        return JsonResponse({'error': 'Déjà traité'}, status=400)
    with transaction.atomic():
        apt.status = 'confirmed'
        apt.save()
        apt.slot.status = 'booked'
        apt.slot.save()
    return JsonResponse({'ok': True})


@api_view(['POST'])
def specialist_appointment_reject(request, pk):
    if request.user.role != 'specialist':
        return JsonResponse({'error': 'Accès refusé'}, status=403)
    try:
        sp = Specialist.objects.get(user=request.user)
        apt = Appointment.objects.get(id=pk, specialist=sp)
    except (Specialist.DoesNotExist, Appointment.DoesNotExist):
        return JsonResponse({'error': 'Rendez-vous introuvable'}, status=404)
    if apt.status != 'pending':
        return JsonResponse({'error': 'Déjà traité'}, status=400)
    with transaction.atomic():
        apt.status = 'rejected'
        apt.save()
        apt.slot.status = 'available'
        apt.slot.save()
    return JsonResponse({'ok': True})


# ── ADMIN ─────────────────────────────────────────────────────────────────────

@api_view(['GET'])
def admin_stats(request):
    if request.user.role != 'admin':
        return JsonResponse({'error': 'Accès refusé'}, status=403)
    return JsonResponse({
        'patients': User.objects.filter(role='patient').count(),
        'specialists': User.objects.filter(role='specialist').count(),
        'appointments': Appointment.objects.count(),
        'pending': Appointment.objects.filter(status='pending').count(),
        'confirmed': Appointment.objects.filter(status='confirmed').count(),
    })


@api_view(['GET'])
def admin_patients(request):
    if request.user.role != 'admin':
        return JsonResponse({'error': 'Accès refusé'}, status=403)
    rows = list(
        User.objects.filter(role='patient')
        .order_by('-created_at')
        .values('id', 'full_name', 'email', 'phone', 'created_at')
    )
    for r in rows:
        r['created_at'] = r['created_at'].isoformat() if r['created_at'] else None
    return JsonResponse(rows, safe=False)


@api_view(['GET', 'POST'])
def admin_specialists(request):
    if request.user.role != 'admin':
        return JsonResponse({'error': 'Accès refusé'}, status=403)

    if request.method == 'GET':
        data = [{
            'id': s.id, 'user_id': s.user.id, 'full_name': s.user.full_name,
            'email': s.user.email, 'phone': s.user.phone, 'specialty': s.specialty,
            'clinic_name': s.clinic.name, 'village_name': s.clinic.village.name,
        } for s in Specialist.objects.select_related('user', 'clinic__village').order_by('user__full_name')]
        return JsonResponse(data, safe=False)

    d = request.data
    full_name = (d.get('full_name') or '').strip()
    email = (d.get('email') or '').strip()
    phone = (d.get('phone') or '').strip() or None
    password = d.get('password') or ''
    specialty = (d.get('specialty') or '').strip()
    clinic_id = d.get('clinic_id')
    bio = (d.get('bio') or '').strip() or None
    if not all([full_name, email, password, specialty, clinic_id]):
        return JsonResponse({'error': 'Champs requis manquants'}, status=400)
    if User.objects.filter(email=email).exists():
        return JsonResponse({'error': 'Email déjà utilisé'}, status=409)
    try:
        clinic = Clinic.objects.get(id=clinic_id)
    except Clinic.DoesNotExist:
        return JsonResponse({'error': 'Clinique introuvable'}, status=404)
    with transaction.atomic():
        user = User.objects.create_user(
            email=email, password=password, full_name=full_name, phone=phone, role='specialist'
        )
        sp = Specialist.objects.create(user=user, clinic=clinic, specialty=specialty, bio=bio)
    return JsonResponse({'id': sp.id})


@api_view(['DELETE'])
def admin_delete_user(request, pk):
    if request.user.role != 'admin':
        return JsonResponse({'error': 'Accès refusé'}, status=403)
    try:
        user = User.objects.get(id=pk)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Utilisateur introuvable'}, status=404)
    if user.role == 'admin':
        return JsonResponse({'error': 'Impossible'}, status=400)
    user.delete()
    return JsonResponse({'ok': True})


@api_view(['GET'])
def admin_clinics(request):
    if request.user.role != 'admin':
        return JsonResponse({'error': 'Accès refusé'}, status=403)
    data = [{
        'id': c.id, 'name': c.name, 'address': c.address, 'phone': c.phone,
        'village_id': c.village_id, 'village_name': c.village.name,
    } for c in Clinic.objects.select_related('village').order_by('village__name', 'name')]
    return JsonResponse(data, safe=False)
