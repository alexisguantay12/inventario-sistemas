from django.contrib import admin

from .models import Area, Sector


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "nombre",
        "activo",
    )

    search_fields = (
        "nombre",
    )

    list_filter = (
        "activo",
    )


@admin.register(Sector)
class SectorAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "nombre",
        "area",
        "activo",
    )

    search_fields = (
        "nombre",
        "area__nombre",
    )

    list_filter = (
        "area",
        "activo",
    )