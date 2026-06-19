from django.contrib import admin
from django.utils.html import format_html
from .models import Perfil, Categoria, Tienda, Visita, Resena

@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
    list_display = ('nombre_usuario', 'puntos_explorador', 'creado_en')
    search_fields = ('nombre_usuario',)
    ordering = ('-puntos_explorador',)

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'icono', 'muestra_color')
    search_fields = ('nombre',)

    def muestra_color(self, obj):
        return format_html(
            '<div style="width: 20px; height: 20px; background-color: {}; border: 1px solid #ccc; border-radius: 50%;"></div>',
            obj.color_hex
        )
    muestra_color.short_description = "Color"

@admin.register(Tienda)
class TiendaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'mostrar_categorias','rango_precios' , 'verificado', 'creado_por')
    list_filter = ('verificado', 'categorias', 'rango_precios', 'creado_en')
    search_fields = ('nombre', 'direccion', 'slug', 'descripcion')
    # Esto autocompleta el slug mientras escribes el nombre
    prepopulated_fields = {'slug': ('nombre',)}
    filter_horizontal = ('categorias',)
    readonly_fields = ('calificacion_promedio', 'creado_en', 'actualizado_en')

    # Función para listar categorías separadas por coma
    def mostrar_categorias(self, obj):
        return ", ".join([c.nombre for c in obj.categorias.all()])
    mostrar_categorias.short_description = "Categorías"

@admin.register(Visita)
class VisitaAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'tienda', 'fecha_visita', 'segmento_calle')
    list_filter = ('fecha_visita',)
    search_fields = ('usuario__nombre_usuario', 'tienda__nombre')

@admin.register(Resena)
class ResenaAdmin(admin.ModelAdmin):
    list_display = ('tienda', 'usuario', 'puntuacion', 'creado_en')
    list_filter = ('puntuacion', 'creado_en')
    search_fields = ('comentario', 'tienda__nombre')
    
    # Mostrar estrellas visualmente en el admin (Opcional, queda bonito)
    def estrellas(self, obj):
        return "⭐" * obj.puntuacion
    estrellas.short_description = "Calificación"
