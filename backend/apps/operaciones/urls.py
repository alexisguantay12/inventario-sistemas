from django.urls import (
    include,
    path,
)

from rest_framework.routers import (
    DefaultRouter,
)

from .views import (
    MovimientoActivoViewSet,
    MovimientoComponenteViewSet,
    OperacionComponenteViewSet,
    OperacionActivoViewSet
)


router = DefaultRouter()


router.register(
    r"componentes",
    OperacionComponenteViewSet,
    basename="operaciones-componentes",
)


router.register(
    r"movimientos-componentes",
    MovimientoComponenteViewSet,
    basename="movimientos-componentes",
)


router.register(
    r"movimientos-activos",
    MovimientoActivoViewSet,
    basename="movimientos-activos",
)
router.register(
    r"activos",
    OperacionActivoViewSet,
    basename="operaciones-activos",
)

urlpatterns = [
    path(
        "",
        include(router.urls),
    ),
]