from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoriaViewSet, TiendaViewSet, RutaExploracionViewSet
from rest_framework_simplejwt.views import (TokenObtainPairView,TokenRefreshView)

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'tiendas', TiendaViewSet, basename='tienda')
router.register(r'rutas', RutaExploracionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), # Login
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # Refrescar sesión
]