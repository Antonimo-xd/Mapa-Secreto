import os
import django
import sys

# Configurar el entorno de Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Categoria

categorias_nuevas = [
    {"nombre": "Cafés Ocultos", "color_hex": "#8B5A2B"},
    {"nombre": "Arte Urbano", "color_hex": "#FF1493"},
    {"nombre": "Miradores", "color_hex": "#00BFFF"},
    {"nombre": "Ruinas Históricas", "color_hex": "#696969"},
    {"nombre": "Gastronomía Local", "color_hex": "#FF4500"},
    {"nombre": "Parques Secretos", "color_hex": "#228B22"},
    {"nombre": "Vida Nocturna", "color_hex": "#8A2BE2"},
    {"nombre": "Ferias Libres", "color_hex": "#FFD700"},
    {"nombre": "Librerías", "color_hex": "#4682B4"},
    {"nombre": "Lugares Abandonados", "color_hex": "#2F4F4F"},
    {"nombre": "Cultura y Museos", "color_hex": "#B22222"},
    {"nombre": "Naturaleza Salvaje", "color_hex": "#006400"},
    {"nombre": "Picadas", "color_hex": "#D2691E"},
    {"nombre": "Deportes Extremos", "color_hex": "#FF0000"},
    {"nombre": "Fotografía", "color_hex": "#9370DB"},
]

creadas = 0
for cat in categorias_nuevas:
    obj, created = Categoria.objects.get_or_create(
        nombre=cat["nombre"],
        defaults={"color_hex": cat["color_hex"]}
    )
    if created:
        creadas += 1
        print(f"Categoria creada: {cat['nombre']}")
    else:
        print(f"Categoria ya existia: {cat['nombre']}")

print(f"\\n{creadas} categorias nuevas añadidas con exito.")
