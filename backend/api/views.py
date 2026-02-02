from rest_framework import viewsets
from .models import Categoria, Tienda
from .serializers import CategoriaSerializer, TiendaSerializer

class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoint para ver las categorías (Solo lectura para visitantes).
    """
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class TiendaViewSet(viewsets.ModelViewSet):
    """
    Endpoint para gestionar tiendas. 
    Filtra por defecto las que están verificadas para el mapa principal.
    """
    serializer_class = TiendaSerializer

    def get_queryset(self):
        queryset = Tienda.objects.all()
        # Si no eres admin, solo ves las tiendas verificadas
        if not self.request.user.is_staff:
            queryset = queryset.filter(verificado=True)
        
        # Opcional: Filtrar por categoría desde la URL (?categoria=id)
        categoria_id = self.request.query_params.get('categoria')
        if categoria_id:
            queryset = queryset.filter(categoria_id=categoria_id)
            
        return queryset