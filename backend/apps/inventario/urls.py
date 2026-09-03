from rest_framework.routers import DefaultRouter

from .views import (
    ActivoViewSet,
    ComponenteViewSet,
    EquipoTrabajoViewSet,
    TipoActivoViewSet,
    TipoComponenteViewSet,
    SistemaOperativoViewSet
)


router = DefaultRouter()

router.register(
    "equipos-trabajo",
    EquipoTrabajoViewSet,
    basename="equipo-trabajo",
)

router.register(
    "tipos-activo",
    TipoActivoViewSet,
    basename="tipo-activo",
)

router.register(
    "activos",
    ActivoViewSet,
    basename="activo",
)

router.register(
    "tipos-componentes",
    TipoComponenteViewSet,
    basename="tipo-componente",
)

router.register(
    "componentes",
    ComponenteViewSet,
    basename="componente",
)
router.register(
    r"sistemas-operativos",
    SistemaOperativoViewSet,
    basename="sistema-operativo",
)

urlpatterns = router.urls