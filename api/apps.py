import sys
from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        if 'runserver' not in sys.argv:
            return
        try:
            from .models import Commune
            if not Commune.objects.exists():
                from django.core.management import call_command
                call_command('seed_communes', verbosity=1)
        except Exception:
            pass
