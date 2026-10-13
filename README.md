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

---

## 🛠️ Stack Tecnológico

El proyecto utiliza una arquitectura *Headless* (Desacoplada) para separar perfectamente la lógica de datos de la interfaz de usuario:

### Frontend
- **Framework:** React 18 (Vite)
- **Estilos:** Tailwind CSS (Estética moderna, utilería de clases)
- **Mapas:** React-Leaflet + Leaflet MarkerCluster
- **Matemáticas Geoespaciales:** Turf.js
- **Gráficos:** Recharts
- **PWA:** vite-plugin-pwa

### Backend
- **Framework:** Django 5 + Django REST Framework (Python)
- **Base de Datos:** PostgreSQL (Vía Supabase)
- **Autenticación:** JWT (JSON Web Tokens)
- **Procesamiento de Imágenes:** Pillow + Client-Side Interceptors

---

## 🚀 Guía de Instalación Rápida

Si deseas correr este proyecto en tu propia máquina, sigue estos pasos:

### 1. Preparación del Backend (Django)
```bash
cd backend
python -m venv venv
# Activar entorno (Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
python manage.py runserver
```

### 2. Preparación del Frontend (React)
Abre otra terminal:
```bash
cd frontend
npm install
npm run dev
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
