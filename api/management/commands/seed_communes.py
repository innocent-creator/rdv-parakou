from django.core.management.base import BaseCommand
from api.models import Commune, Village

COMMUNES = [
    ('Parakou', [
        'Banikanni', 'Zongo', 'Madina', 'Albarika', 'Kpébié', 'Guéma',
        'Titirou', 'Parakou Centre', 'Ganhi', 'Douroubé', 'Wansirou', 'Tourou',
    ]),
    ("N'Dali", ["N'Dali centre", 'Bori', 'Gbégourou', 'Sori', 'Pèdè']),
    ('Nikki', ['Nikki centre', 'Biro', 'Suya', 'Tasso', 'Sérékalé']),
    ('Bembèrèkè', ['Bembèrèkè centre', 'Bouanri', 'Boro', 'Gamia']),
    ('Sinendé', ['Sinendé centre', 'Founougo', 'Doguè']),
    ('Pèrèrè', ['Pèrèrè centre', 'Gnonkourokali', 'Ko']),
    ('Kalalé', ['Kalalé centre', 'Derassi', 'Bagou']),
    ('Tchaourou', ['Tchaourou centre', 'Bétérou', 'Alafiarou', 'Goro']),
]


class Command(BaseCommand):
    help = 'Insère les communes et rattache les villages correspondants'

    def handle(self, *args, **kwargs):
        created_communes = 0
        linked_villages = 0

        for commune_name, village_names in COMMUNES:
            commune, c_created = Commune.objects.get_or_create(name=commune_name)
            if c_created:
                created_communes += 1

            for v_name in village_names:
                village, _ = Village.objects.get_or_create(name=v_name)
                if village.commune != commune:
                    village.commune = commune
                    village.save(update_fields=['commune'])
                    linked_villages += 1

        self.stdout.write(self.style.SUCCESS(
            f'✅ {created_communes} commune(s) créée(s), {linked_villages} village(s) rattaché(s).'
        ))
