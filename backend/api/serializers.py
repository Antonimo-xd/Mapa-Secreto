from rest_framework import serializers
from .models import Categoria, Tienda, RutaExploracion

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class TiendaSerializer(serializers.ModelSerializer):
    # Esto permite leer los detalles completos de la categoría (nombre, color)
    # pero escribir usando solo los IDs. ¡Es un truco muy útil!
    categorias_detalle = CategoriaSerializer(source='categorias', many=True, read_only=True)
    
    class Meta:
        model = Tienda
        fields = [
            'id', 
            'nombre', 
            'slug',
            'categorias',         # <--- Para escribir (envías lista de IDs: [1, 5])
            'categorias_detalle', # <--- Para leer (recibes objetos completos: [{nombre: "Café"...}])
            'direccion',
            'latitud', 
            'longitud', 
            'descripcion', 
            'rango_precios', 
            'verificado', 
            'url_imagen', 
            'contacto', 
            'horarios',
            'imagen',         
        ]
        read_only_fields = ['id', 'slug', 'verificado', 'creado_por', 'creado_en', 'actualizado_en']
        extra_kwargs = {
            'contacto': {'required': False, 'allow_null': True},
            'horarios': {'required': False, 'allow_null': True},
            'descripcion': {'required': False, 'allow_blank': True}, # (Opcional) Por si a veces no pones descripción
            'direccion': {'required': False, 'allow_blank': True},   # (Opcional) Por si a veces no pones dirección
        }

class RutaExploracionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RutaExploracion
        fields = '__all__'