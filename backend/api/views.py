from rest_framework import viewsets, permissions
from .models import Categoria, Tienda, RutaExploracion
from .serializers import CategoriaSerializer, TiendaSerializer, RutaExploracionSerializer

class CategoriaViewSet(viewsets.ModelViewSet): # <--- CAMBIO AQUI
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class TiendaViewSet(viewsets.ModelViewSet):
    """
    Endpoint para gestionar tiendas. 
    Filtra por defecto las que están verificadas para el mapa principal.
    """
    serializer_class = TiendaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Tienda.objects.all()
        # Si no eres admin, solo ves las tiendas verificadas
        if not self.request.user.is_staff:
            queryset = queryset.filter(verificado=True)
        
        # Opcional: Filtrar por categoría desde la URL (?categoria=id)
        categoria_id = self.request.query_params.get('categoria')
        if categoria_id:
            queryset = queryset.filter(categorias__id=categoria_id)
            
        return queryset
    
    def perform_create(self, serializer):
        # Inyecta el usuario que está haciendo la petición y la marca como verificada
        serializer.save(
            creado_por=self.request.user.perfil,
            verificado=True
        )

class RutaExploracionViewSet(viewsets.ModelViewSet):
    queryset = RutaExploracion.objects.all()
    serializer_class = RutaExploracionSerializer