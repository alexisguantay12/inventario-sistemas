from rest_framework import viewsets

from .models import Area, Sector
from .serializers import AreaSerializer, SectorSerializer


class AreaViewSet(viewsets.ModelViewSet):
    serializer_class = AreaSerializer

    def get_queryset(self):
        return Area.objects.filter(
            is_deleted=False
        ).order_by("nombre")

    def perform_create(self, serializer):
        serializer.save(
            user_made=self.request.user
            if self.request.user.is_authenticated
            else None
        )

    def perform_update(self, serializer):
        serializer.save(
            user_updated=self.request.user
            if self.request.user.is_authenticated
            else None
        )

    def perform_destroy(self, instance):
        user = (
            self.request.user
            if self.request.user.is_authenticated
            else None
        )

        instance.delete(user=user)


class SectorViewSet(viewsets.ModelViewSet):
    serializer_class = SectorSerializer

    def get_queryset(self):
        queryset = (
            Sector.objects
            .filter(is_deleted=False)
            .select_related("area")
        )

        area = self.request.query_params.get("area")

        if area:
            queryset = queryset.filter(area_id=area)

        return queryset.order_by(
            "area__nombre",
            "nombre",
        )

    def perform_create(self, serializer):
        serializer.save(
            user_made=self.request.user
            if self.request.user.is_authenticated
            else None
        )

    def perform_update(self, serializer):
        serializer.save(
            user_updated=self.request.user
            if self.request.user.is_authenticated
            else None
        )

    def perform_destroy(self, instance):
        user = (
            self.request.user
            if self.request.user.is_authenticated
            else None
        )

        instance.delete(user=user)