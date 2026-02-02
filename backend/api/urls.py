from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoriaViewSet, TiendaViewSet

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'tiendas', TiendaViewSet, basename='tienda')

urlpatterns = [
    path('', include(router.urls)),
]