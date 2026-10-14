import os
import django
import sys

# Configurar el entorno de Django para ejecutar como script independiente
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Categoria

categorias_nuevas = [
    {"nombre": "Cafés Ocultos", "color_hex": "#8B5A2B", "icono": "coffee"},
    {"nombre": "Arte Urbano", "color_hex": "#FF1493", "icono": "palette"},
    {"nombre": "Miradores", "color_hex": "#00BFFF", "icono": "eye"},
    {"nombre": "Ruinas Históricas", "color_hex": "#696969", "icono": "landmark"},
    {"nombre": "Gastronomía Local", "color_hex": "#FF4500", "icono": "utensils"},
    {"nombre": "Parques Secretos", "color_hex": "#228B22", "icono": "tree"},
    {"nombre": "Vida Nocturna", "color_hex": "#8A2BE2", "icono": "moon"},
    {"nombre": "Ferias Libres", "color_hex": "#FFD700", "icono": "shopping-bag"},
    {"nombre": "Librerías", "color_hex": "#4682B4", "icono": "book-open"},
    {"nombre": "Lugares Abandonados", "color_hex": "#2F4F4F", "icono": "ghost"},
    {"nombre": "Cultura y Museos", "color_hex": "#B22222", "icono": "building"},
    {"nombre": "Naturaleza Salvaje", "color_hex": "#006400", "icono": "mountain"},
    {"nombre": "Picadas", "color_hex": "#D2691E", "icono": "flame"},
    {"nombre": "Deportes Extremos", "color_hex": "#FF0000", "icono": "zap"},
    {"nombre": "Fotografía", "color_hex": "#9370DB", "icono": "camera"},
]

creadas = 0
for cat in categorias_nuevas:
    obj, created = Categoria.objects.get_or_create(
        nombre=cat["nombre"],
        defaults={
            "color_hex": cat["color_hex"],
            "icono": cat["icono"]
        }
    )
    if created:
        creadas += 1
        print(f"✅ Categoría creada: {cat['nombre']}")
    else:
        print(f"ℹ️ Categoría ya existía: {cat['nombre']}")

print(f"\n{creadas} categorías nuevas añadidas con éxito.")
