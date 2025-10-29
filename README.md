# 🗺️ Mapa Secreto (Proyecto)

## 1. Visión del Proyecto

"Mi proyecto es Mapa Secreto, una plataforma curada y asistida por la comunidad para catalogar el comercio local." 
La aplicación permite a los usuarios ver el mapa interactivo y sugerir nuevas tiendas, puestos o servicios.

Todas las sugerencias pasan por un panel de moderación del administrador para revisar, editar y aprobar el contenido. Esto mantiene la alta calidad de los datos y evita el 'ruido'.

## 2. Stack Tecnológico 💻

Este proyecto utiliza una arquitectura desacoplada:

* **Backend (API):** Django + Django Rest Framework 
* **Frontend (Web):** React 
* **Frontend (Móvil):** React Native (planeado)
* **Base de Datos:** Supabase (PostgreSQL)
* **Mapa:** Leaflet.js

## 3. Características Principales

* **Mapa Interactivo:** Visualización de tiendas con detalles y fotos.
* **Filtros:** Búsqueda por categorías y etiquetas (ej: #vegano, #hechoamano).
* **Modelo Híbrido (Crowdsourcing):** Los usuarios pueden "Sugerir un Lugar", que luego es aprobado por un administrador.
* **Panel de Administrador:** Herramientas para moderar contenido, gestionar datos y un rastreador visual de exploración.
* **Gamificación (Futuro):** Ideas para Puntos de Explorador e Insignias.

## 4. Principios de Calidad y Seguridad

Este proyecto se adhiere a las buenas prácticas de la ingeniería de software:

* **Seguridad:** Sigue las recomendaciones de OWASP Top 10 y aplica seguridad en capas (HTTPS, Hashing, JWT, etc.).
* **Calidad:** Implementa pruebas (Unitarias y de Integración), Linters (Flake8, ESLint), y principios de Clean Code (SOLID, DRY).
* **Legal:** Se operará con una Política de Privacidad y T&C para cumplir con la protección de datos.
