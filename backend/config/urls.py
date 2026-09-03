from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "api/estructura/",
        include("apps.estructura.urls"),
    ),

    path(
        "api/inventario/",
        include("apps.inventario.urls"),
    ),
    path(
        "api/operaciones/",
        include(
            "apps.operaciones.urls"
        ),
    ),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )