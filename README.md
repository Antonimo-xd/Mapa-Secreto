# 📍 Mapa Secreto

## 1. Visión del Proyecto
**Mapa Secreto** es una plataforma digital diseñada para catalogar y visibilizar el comercio hiperlocal de la Región de Coquimbo (La Serena) que a menudo no figura en los mapas tradicionales.

A diferencia de otros servicios, operamos bajo un **modelo híbrido**: los usuarios sugieren lugares y un administrador modera el contenido para asegurar la calidad y evitar el "ruido".

## 2. Stack Tecnológico 💻
Este proyecto utiliza una arquitectura desacoplada (Headless) optimizada para la escalabilidad:
* **Backend (API):** Django + Django Rest Framework.
* **Frontend (Web):** React + Leaflet.js.
* **Base de Datos:** PostgreSQL (vía Supabase).
* **Seguridad:** Supabase Auth (Integración con perfiles de usuario).

## 3. Modelo de Datos (DER)
El siguiente diagrama representa la estructura de nuestra base de datos, con todos los campos en español y optimizada para la geolocalización y el sistema de puntos por exploración:

```mermaid
erDiagram
    PERFIL ||--o{ TIENDA : "crea"
    PERFIL ||--o{ VISITA : "registra"
    PERFIL ||--o{ RESENA : "escribe"
    CATEGORIA ||--o{ TIENDA : "clasifica"
    TIENDA ||--o{ VISITA : "es_visitada"
    TIENDA ||--o{ RESENA : "recibe"

    PERFIL {
        uuid id PK "Vinculado a auth.users"
        string nombre_usuario
        int puntos_explorador
        datetime creado_en
    }

    CATEGORIA {
        uuid id PK
        string nombre
        string icono
        string color_hex
    }

    TIENDA {
        uuid id PK
        uuid categoria_id FK
        uuid creado_por_id FK
        string nombre
        string slug "Identificador único para URL"
        string descripcion
        decimal latitud
        decimal longitud
        int rango_precios "1-4"
        jsonb contacto "IG, WhatsApp, Web"
        jsonb horarios "L-V, S-D"
        boolean verificado
        string url_imagen
        decimal calificacion_promedio
        datetime creado_en
        datetime actualizado_en
    }

    VISITA {
        uuid id PK
        uuid usuario_id FK
        uuid tienda_id FK
        string segmento_calle "Opcional para Fog of War"
        datetime fecha_visita
    }

    RESENA {
        uuid id PK
        uuid usuario_id FK
        uuid tienda_id FK
        int puntuacion "1-5"
        text comentario
        datetime creado_en
    }

## 4. Historias de Usuario (MVP)

| Rol | Descripción |
| :--- | :--- |
| **Visitante** | Puede filtrar y visualizar comercios locales en el mapa interactivo para descubrir nuevos lugares. |
| **Colaborador** | Puede sugerir nuevos comercios mediante formularios y ganar **puntos de explorador** por su contribución. |
| **Administrador** | Modera las sugerencias enviadas y gestiona el **"Exploration Tracker"** privado para control de calidad. |

## 5. Próximos Pasos (Sprint 1)

- [ ] **Setup Backend:** Configuración inicial de Django y conexión mediante el driver de PostgreSQL a Supabase.
- [ ] **Capa de Datos:** Implementación de los `models.py` utilizando los nombres de campos en español definidos en el DER.
- [ ] **Setup Frontend:** Inicialización de React y renderizado de la vista base con Leaflet.js centrada en las coordenadas de La Serena.
- [ ] **Integración Inicial:** Creación del primer endpoint en DRF para listar los comercios verificados en el mapa.
