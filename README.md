# 📍 Mapa Secreto (Proyecto)

## 1. Visión del Proyecto
**Mapa Secreto** es una plataforma digital curada y asistida por la comunidad, diseñada para catalogar y visibilizar el vibrante comercio hiperlocal que a menudo no figura en los mapas tradicionales. 

A diferencia de otros servicios, operamos bajo un **modelo híbrido**: los usuarios sugieren lugares y un administrador modera el contenido para asegurar la calidad y evitar el "ruido".

## 2. Stack Tecnológico 💻
Este proyecto utiliza una arquitectura desacoplada (Headless):
* **Backend (API):** Django + Django Rest Framework 
* **Frontend (Web):** React + Leaflet.js
* **Base de Datos:** PostgreSQL (vía Supabase)
* **Frontend (Móvil):** React Native (planeado)

## 3. Modelo de Datos (DER)
El siguiente diagrama representa la estructura de nuestra base de datos, optimizada para la geolocalización y la moderación:

```mermaid
erDiagram
    USUARIO ||--o{ TIENDA : "sugiere"
    USUARIO ||--o{ VISITA : "registra"
    CATEGORIA ||--o{ TIENDA : "clasifica"

    USUARIO {
        uuid id PK
        string username
        string email
    }

    CATEGORIA {
        int id PK
        string nombre
        string icono
    }

    TIENDA {
        uuid id PK
        string nombre
        string slug
        decimal latitud
        decimal longitud
        string estado_validacion
        datetime ultima_verificacion
        int categoria_id FK
    }

    VISITA {
        int id PK
        string calle_segmento
        string estado_color
        datetime fecha_visita
        uuid usuario_id FK
    }
