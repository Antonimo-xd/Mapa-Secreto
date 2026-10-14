# 🗺️ Mapa Secreto

**Mapa Secreto** es una aplicación web progresiva (PWA) de alto rendimiento diseñada para descubrir, registrar y rastrear ubicaciones ocultas o tiendas locales en la región de La Serena y Coquimbo.

Construida con un enfoque **Mobile-First**, la aplicación combina la fluidez de una aplicación nativa con la flexibilidad de la web, permitiendo a exploradores urbanos catalogar puntos de interés, medir sus recorridos mediante GPS y administrar una base de datos geoespacial de forma intuitiva.

---

## ✨ Características Principales

*   **📱 Instalable (PWA):** Diseñada para funcionar como una aplicación nativa. Se puede instalar en iOS y Android, ofreciendo una experiencia inmersiva sin bordes del navegador y rendimiento mejorado.
*   **📍 Mapeo Interactivo:** Renderizado ultra rápido con Leaflet y agrupación de marcadores (clustering) para manejar cientos de ubicaciones sin degradación de rendimiento.
*   **🚶‍♂️ Tracking GPS en Tiempo Real:** Motor de geolocalización que traza líneas de ruta mientras caminas, permitiendo a los exploradores registrar las calles exactas que han cubierto.
*   **📏 Métricas Geoespaciales:** Integración profunda con **Turf.js** para procesar datos espaciales matemáticamente y calcular la distancia exacta (en Kilómetros) de las rutas registradas, considerando la curvatura terrestre.
*   **📸 Optimización de Imágenes en el Cliente:** Sistema de compresión interceptiva mediante Web Workers (`browser-image-compression`) que reduce imágenes de varios Megabytes a fracciones de Kilobyte *antes* de enviarlas a la base de datos, garantizando tiempos de carga veloces.
*   **📊 Dashboard de Administrador:** Un panel analítico con gráficos interactivos (`Recharts`) para visualizar la distribución de categorías, rangos de precios y métricas de exploración.
*   **📡 Resiliencia de Red:** Adaptable de forma dinámica a entornos locales (`localhost`) o túneles de internet seguro (`Cloudflare`) de forma automática.

*   **🎨 Multi-Tema Cartográfico:** Intercambia en vivo entre tres estéticas únicas (*Boutique*, *Cyberpunk* y *Aventura*) con azulejos optimizados de OpenStreetMap y ArcGIS World Topo.
*   **🔥 Mapa de Calor (Heatmap):** Alterna a la vista térmica para identificar zonas con mayor densidad de comercios y locales secretos.
*   **📶 Modo Offline-First:** Cola de sincronización local persistida en IndexedDB (`localforage`) que almacena acciones sin conexión y las sube automáticamente al recuperar internet.

---

## 🛠️ Stack Tecnológico

El proyecto utiliza una arquitectura *Headless* (Desacoplada) y contenedorizada con Docker:

### Frontend
- **Framework:** React 19 + Vite 7
- **Estilos:** Tailwind CSS v4 + Vanilla CSS dinámico
- **Mapas:** React-Leaflet + Leaflet MarkerCluster + Leaflet Heat
- **Matemáticas Geoespaciales:** Turf.js
- **Gráficos & Métricas:** Recharts
- **Offline & PWA:** `vite-plugin-pwa` + `localforage` (IndexedDB)

### Backend
- **Framework:** Django 5.2 + Django REST Framework (Python 3.12)
- **Base de Datos:** PostgreSQL (Vía Supabase)
- **Autenticación:** SimpleJWT (JSON Web Tokens)
- **Procesamiento de Imágenes:** Pillow + `browser-image-compression`

### Infraestructura & DevOps
- **Contenedores:** Docker & Docker Compose
- **Túneles:** Cloudflare Tunnels (`cloudflared`)

---

## 🚀 Guía de Instalación Rápida

### Opción Recomendada: Con Docker (1 solo comando)
```bash
# Iniciar backend y frontend simultáneamente
docker compose up
```
* **Frontend:** `http://localhost:5173`
* **Backend API:** `http://localhost:8000`
* **Django Admin:** `http://localhost:8000/admin`

### Opción Alternativa: Ejecución Local Nativa
1. **Backend (Django):**
   ```bash
   cd backend
   .\venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py runserver 0.0.0.0:8000
   ```
2. **Frontend (React):**
   ```bash
   cd frontend
   npm install
   npm run dev -- --host
   ```

---

## 🌐 Cómo Probar la Aplicación en el Celular (PWA)

Para que iOS y Android te permitan instalar la aplicación, es un requisito obligatorio que la conexión sea **segura (`https://`)**. Para ello, utilizamos **Cloudflare Tunnels**.

1. Asegúrate de tener el Backend y Frontend corriendo en tus terminales (ver paso anterior).
2. Abre dos terminales nuevas y ejecuta:
```bash
# Túnel para el Backend (API)
npx cloudflared tunnel --url http://localhost:8000

# Túnel para el Frontend (Vista)
npx cloudflared tunnel --url http://localhost:5173
```
3. Copia el enlace `https://...trycloudflare.com` que generó el **Túnel del Backend** y pégalo en el archivo `frontend/src/config.js` en la variable `API_URL`.
4. Copia el enlace que generó el **Túnel del Frontend**, ábrelo en Safari (iOS) o Chrome (Android) en tu teléfono, y selecciona la opción **"Agregar a la pantalla de inicio"**.

¡Listo! Ya tienes Mapa Secreto instalado de forma nativa en tu teléfono.

---

*Desarrollado con pasión para exploradores urbanos.*
