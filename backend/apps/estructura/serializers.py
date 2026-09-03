from rest_framework import serializers

from .models import Area, Sector


class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = [
            "id",
            "nombre",
            "descripcion",
            "activo",
            "created_at",
            "updated_at",
            "user_made",
            "user_updated",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "user_made",
            "user_updated",
        ]


class SectorSerializer(serializers.ModelSerializer):
    area_nombre = serializers.CharField(
        source="area.nombre",
        read_only=True,
    )

    class Meta:
        model = Sector
        fields = [
            "id",
            "area",
            "area_nombre",
            "nombre",
            "descripcion",
            "activo",
            "created_at",
            "updated_at",
            "user_made",
            "user_updated",
        ]
        read_only_fields = [
            "id",
            "area_nombre",
            "created_at",
            "updated_at",
            "user_made",
            "user_updated",
        ]