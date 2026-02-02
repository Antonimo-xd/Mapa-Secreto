from rest_framework import serializers
from .models import Categoria, Tienda, Perfil, Resena

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class TiendaSerializer(serializers.ModelSerializer):
    # Esto permite ver el nombre de la categoría en lugar de solo el ID
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')
    
    class Meta:
        model = Tienda
        fields = [
            'id', 'nombre', 'slug', 'descripcion', 'latitud', 'longitud', 
            'rango_precios', 'contacto', 'horarios', 'url_imagen', 
            'calificacion_promedio', 'verificado', 'categoria', 'categoria_nombre'
        ]