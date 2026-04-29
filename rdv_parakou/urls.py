import traceback
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.core.mail import send_mail
from django.http import HttpResponse


def test_email_view(request):
    target = 'rdvparakou@gmail.com'
    try:
        send_mail(
            subject='✅ Test email — RDV Parakou',
            message='Ceci est un email de test envoyé depuis RDV Parakou.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[target],
            fail_silently=False,
        )
        return HttpResponse(
            f'✅ Email envoyé avec succès à {target}',
            content_type='text/plain; charset=utf-8',
        )
    except Exception:
        tb = traceback.format_exc()
        print('\n' + '='*60)
        print('ERREUR ENVOI EMAIL — traceback complet :')
        print('='*60)
        print(tb)
        print('='*60 + '\n')
        return HttpResponse(
            f'❌ Erreur :\n\n{tb}',
            content_type='text/plain; charset=utf-8',
            status=500,
        )


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('', TemplateView.as_view(template_name='index.html')),
    path('patient', TemplateView.as_view(template_name='patient.html')),
    path('specialist', TemplateView.as_view(template_name='specialist.html')),
    path('admin-panel', TemplateView.as_view(template_name='admin.html')),
    path('admin-login', TemplateView.as_view(template_name='admin_login.html')),
    path('test-email/', test_email_view),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
