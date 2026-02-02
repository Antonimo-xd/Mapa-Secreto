from django.contrib import admin
from .models import Perfil, Categoria, Tienda, Visita, Resena

@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
    list_display = ('nombre_usuario', 'puntos_explorador', 'creado_en')
    search_fields = ('nombre_usuario',)

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'icono', 'color_hex')

@admin.register(Tienda)
class TiendaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'categoria', 'verificado', 'creado_en')
    list_filter = ('verificado', 'categoria')
    search_fields = ('nombre', 'descripcion')
    # Esto autocompleta el slug mientras escribes el nombre
    prepopulated_fields = {'slug': ('nombre',)}

admin.site.register(Visita)
admin.site.register(Resena)