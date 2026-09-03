from rest_framework.routers import DefaultRouter

from .views import AreaViewSet, SectorViewSet


router = DefaultRouter()

router.register(
    "areas",
    AreaViewSet,
    basename="area",
)

router.register(
    "sectores",
    SectorViewSet,
    basename="sector",
)


urlpatterns = router.urls