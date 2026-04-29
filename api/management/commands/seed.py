from datetime import date, timedelta
from django.core.management.base import BaseCommand
from api.models import User, Village, Clinic, Specialist, AvailabilitySlot


VILLAGES = ['Titirou', 'Wansirou', 'Banikanni', 'Ladjifarani', 'Albarika', 'Tourou', 'Thian', 'Zongo', 'Baparapé']

CLINICS_BY_VILLAGE = {
    'Titirou': [
        {'name': 'Clinique Saint-Pierre', 'address': 'Carrefour Titirou', 'phone': '+229 61 00 00 01'},
        {'name': 'Centre Médical Horizon', 'address': 'Route de Titirou', 'phone': '+229 61 00 00 02'},
    ],
    'Wansirou': [{'name': 'Polyclinique Wansirou', 'address': 'Av. Wansirou', 'phone': '+229 61 00 00 03'}],
    'Banikanni': [
        {'name': 'Clinique La Grâce', 'address': 'Banikanni centre', 'phone': '+229 61 00 00 04'},
        {'name': 'Cabinet Médical Espoir', 'address': 'Banikanni marché', 'phone': '+229 61 00 00 05'},
    ],
    'Ladjifarani': [{'name': 'Clinique Bon Samaritain', 'address': 'Ladjifarani', 'phone': '+229 61 00 00 06'}],
    'Albarika': [{'name': 'Centre Santé Albarika', 'address': 'Albarika', 'phone': '+229 61 00 00 07'}],
    'Tourou': [{'name': 'Clinique Tourou Santé', 'address': 'Tourou', 'phone': '+229 61 00 00 08'}],
    'Thian': [{'name': 'Polyclinique Thian', 'address': 'Thian', 'phone': '+229 61 00 00 09'}],
    'Zongo': [{'name': 'Clinique Zongo', 'address': 'Zongo', 'phone': '+229 61 00 00 10'}],
    'Baparapé': [{'name': 'Centre Médical Baparapé', 'address': 'Baparapé', 'phone': '+229 61 00 00 11'}],
}

SPECIALISTS = [
    {'name': 'Dr. Adjovi Sèna', 'email': 'adjovi@rdv.bj', 'specialty': 'Cardiologue', 'bio': "15 ans d'expérience en cardiologie."},
    {'name': 'Dr. Kassa Mathieu', 'email': 'kassa@rdv.bj', 'specialty': 'Pédiatre', 'bio': 'Santé infantile et vaccination.'},
    {'name': 'Dr. Hounkpatin Léa', 'email': 'hounkpatin@rdv.bj', 'specialty': 'Gynécologue', 'bio': 'Suivi de grossesse.'},
    {'name': 'Dr. Bio Yérima', 'email': 'bio@rdv.bj', 'specialty': 'Dermatologue', 'bio': 'Affections cutanées.'},
    {'name': 'Dr. Dossou Paul', 'email': 'dossou@rdv.bj', 'specialty': 'Ophtalmologue', 'bio': 'Chirurgie de la cataracte.'},
    {'name': 'Dr. Tchégnon Rose', 'email': 'tchegnon@rdv.bj', 'specialty': 'Dentiste', 'bio': 'Odontologie et orthodontie.'},
    {'name': 'Dr. Soulé Abdou', 'email': 'soule@rdv.bj', 'specialty': 'Généraliste', 'bio': 'Médecin de famille.'},
    {'name': 'Dr. Orou Bouko', 'email': 'orou@rdv.bj', 'specialty': 'ORL', 'bio': 'Oto-rhino-laryngologie.'},
    {'name': 'Dr. Ahouandjinou Fidèle', 'email': 'ahouandjinou@rdv.bj', 'specialty': 'Neurologue', 'bio': 'Céphalées et troubles.'},
    {'name': 'Dr. Gnimadi Claire', 'email': 'gnimadi@rdv.bj', 'specialty': 'Généraliste', 'bio': 'Consultations familiales.'},
]

SLOTS = [('08:00', '09:00'), ('09:00', '10:00'), ('10:00', '11:00'), ('14:00', '15:00'), ('15:00', '16:00')]


class Command(BaseCommand):
    help = 'Initialise la base de données avec des données de démo'

    def handle(self, *args, **kwargs):
        if User.objects.exists():
            self.stdout.write('Base déjà initialisée.')
            return

        # Villages
        village_objs = {name: Village.objects.create(name=name) for name in VILLAGES}

        # Clinics
        clinic_list = []
        for v_name in VILLAGES:
            for c in CLINICS_BY_VILLAGE[v_name]:
                clinic_list.append(Clinic.objects.create(village=village_objs[v_name], **c))

        # Admin
        User.objects.create_user(
            email='admin@rdv.bj', password='admin123',
            full_name='Administrateur', phone='+229 61 00 00 00', role='admin',
            is_staff=True, is_superuser=True,
        )

        # Specialists
        today = date.today()
        for i, s in enumerate(SPECIALISTS):
            user = User.objects.create_user(
                email=s['email'], password='doc123',
                full_name=s['name'], phone=f'+229 97 00 00 {10 + i:02d}', role='specialist',
            )
            clinic = clinic_list[i % len(clinic_list)]
            sp = Specialist.objects.create(user=user, clinic=clinic, specialty=s['specialty'], bio=s['bio'])
            for d in range(1, 7):
                day = today + timedelta(days=d)
                for start, end in SLOTS:
                    AvailabilitySlot.objects.create(
                        specialist=sp, slot_date=day, start_time=start, end_time=end, status='available'
                    )

        # Demo patient
        User.objects.create_user(
            email='patient@rdv.bj', password='patient123',
            full_name='Patient Démo', phone='+229 97 11 22 33', role='patient',
        )

        self.stdout.write(self.style.SUCCESS('✅ Base initialisée avec succès.'))
