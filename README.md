# 🗺️ Mapa Secreto (Proyecto)

## 1. Visión del Proyecto

[cite_start]"Mi proyecto es Mapa Secreto, una plataforma curada y asistida por la comunidad para catalogar el comercio local." [cite: 4]
[cite_start]La aplicación permite a los usuarios ver el mapa interactivo y sugerir nuevas tiendas, puestos o servicios[cite: 5].

[cite_start]Todas las sugerencias pasan por un panel de moderación del administrador para revisar, editar y aprobar el contenido[cite: 6]. [cite_start]Esto mantiene la alta calidad de los datos y evita el 'ruido'[cite: 7].

## 2. Stack Tecnológico 💻

Este proyecto utiliza una arquitectura desacoplada:

* [cite_start]**Backend (API):** Django + Django Rest Framework [cite: 54, 55]
* [cite_start]**Frontend (Web):** React [cite: 54, 60]
* [cite_start]**Frontend (Móvil):** React Native (planeado) [cite: 66]
* [cite_start]**Base de Datos:** Supabase (PostgreSQL) [cite: 52]
* [cite_start]**Mapa:** Leaflet.js [cite: 50]

## 3. Características Principales

* [cite_start]**Mapa Interactivo:** Visualización de tiendas con detalles y fotos.
* [cite_start]**Filtros:** Búsqueda por categorías y etiquetas (ej: #vegano, #hechoamano)[cite: 14, 15, 39].
* [cite_start]**Modelo Híbrido (Crowdsourcing):** Los usuarios pueden "Sugerir un Lugar" [cite: 43][cite_start], que luego es aprobado por un administrador[cite: 6, 27].
* [cite_start]**Panel de Administrador:** Herramientas para moderar contenido [cite: 27][cite_start], gestionar datos [cite: 31] [cite_start]y un rastreador visual de exploración[cite: 25].
* [cite_start]**Gamificación (Futuro):** Ideas para Puntos de Explorador e Insignias[cite: 12, 13].

## 4. Principios de Calidad y Seguridad

Este proyecto se adhiere a las buenas prácticas de la ingeniería de software:

* [cite_start]**Seguridad:** Sigue las recomendaciones de OWASP Top 10 [cite: 88] [cite_start]y aplica seguridad en capas (HTTPS, Hashing, JWT, etc.) [cite: 94-118].
* [cite_start]**Calidad:** Implementa pruebas (Unitarias y de Integración) [cite: 75-78][cite_start], Linters (Flake8, ESLint) [cite: 80][cite_start], y principios de Clean Code (SOLID, DRY)[cite: 70, 71].
* [cite_start]**Legal:** Se operará con una Política de Privacidad y T&C para cumplir con la protección de datos[cite: 148, 149].
