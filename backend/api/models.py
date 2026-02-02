import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator

# 1. Perfil de Usuario (Extensión de Auth User)
class Perfil(models.Model):
    id = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='perfil')
    nombre_usuario = models.CharField(max_length=150)
    puntos_explorador = models.IntegerField(default=0)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Perfiles"

    def __str__(self):
        return self.nombre_usuario

# 2. Categoría de Comercios
class Categoria(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100, unique=True)
    icono = models.CharField(max_length=50, help_text="Nombre del icono (FontAwesome/Lucide)")
    color_hex = models.CharField(max_length=7, default="#3b82f6")

    class Meta:
        verbose_name_plural = "Categorías"

    def __str__(self):
        return self.nombre

# 3. Entidad Tienda (El núcleo de Mapa Secreto)
class Tienda(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='tiendas')
    creado_por = models.ForeignKey(Perfil, on_delete=models.SET_NULL, null=True, related_name='tiendas_sugeridas')
    
    nombre = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    descripcion = models.TextField()
    
    # Geolocalización
    latitud = models.DecimalField(max_digits=20, decimal_places=16)
    longitud = models.DecimalField(max_digits=21, decimal_places=16)
    
    # Datos Adicionales
    rango_precios = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(4)],
        help_text="Escala del 1 al 4"
    )
    
    # PostgreSQL JSONB fields
    contacto = models.JSONField(default=dict, help_text="Estructura: {'ig': '@...', 'wsp': '...'}")
    horarios = models.JSONField(default=dict, help_text="Estructura: {'lunes': '09:00-18:00'}")
    
    verificado = models.BooleanField(default=False)
    url_imagen = models.URLField(max_length=500, blank=True, null=True)
    calificacion_promedio = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre

# 4. Registro de Visitas (Exploration Tracker)
class Visita(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(Perfil, on_delete=models.CASCADE, related_name='visitas')
    tienda = models.ForeignKey(Tienda, on_delete=models.CASCADE, related_name='visitas')
    segmento_calle = models.CharField(max_length=255, blank=True, null=True)
    fecha_visita = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Evita que un usuario farmee puntos con la misma tienda
        unique_together = ('usuario', 'tienda')

# 5. Reseñas y Comentarios
class Resena(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(Perfil, on_delete=models.CASCADE, related_name='resenas')
    tienda = models.ForeignKey(Tienda, on_delete=models.CASCADE, related_name='resenas')
    puntuacion = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comentario = models.TextField()
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Reseña"