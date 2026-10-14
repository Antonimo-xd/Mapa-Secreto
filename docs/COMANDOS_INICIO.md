# 🚀 Comandos para Iniciar el Servidor (Mapa Secreto)

Guarda este archivo como referencia rápida para encender tu entorno de desarrollo.

---

## Opción 1: Usando Docker (Recomendada - 1 solo comando)
Esta es la forma más rápida y moderna. No necesitas activar entornos virtuales ni instalar dependencias manualmente.

```bash
# Enciende el Backend (Django) y Frontend (React) en paralelo
docker compose up

# Para apagar todo de forma limpia:
docker compose down
```
* **Frontend:** `http://localhost:5173`
* **Backend API:** `http://localhost:8000`
* **Django Admin:** `http://localhost:8000/admin`

---

## Opción 2: Trabajar de forma local nativa (Menor consumo de RAM)
Usa esta opción si estás programando en una computadora con poca memoria RAM y prefieres correr los procesos nativamente.

**1. Levantar el Backend (Django)**
Abre una terminal, entra a la carpeta `backend` y ejecuta:
```bash
# Windows
.\venv\Scripts\activate
python manage.py runserver 0.0.0.0:8000
```

**2. Levantar el Frontend (React)**
Abre otra terminal, entra a la carpeta `frontend` y ejecuta:
```bash
npm run dev -- --host
```

---

## Opción 3: Probar en Celular o Compartir (Cloudflare Tunnels)
Usa esta opción si quieres compartir el proyecto a través de internet o si quieres probar la **instalación de la PWA** en tu celular, ya que los navegadores móviles exigen una conexión segura `https://` para permitir la instalación.

**1. Levantar el Backend y su Túnel**
Abre dos terminales:
```bash
# Terminal 1 (Servidor Django o Docker)
python manage.py runserver

# Terminal 2 (Túnel hacia Django)
npx cloudflared tunnel --url http://localhost:8000
```
> [!IMPORTANT]
> Copia el enlace que te arroje la Terminal 2 (ej: `https://gatos.trycloudflare.com`). 
> Ve a tu archivo `frontend/src/config.js` y asegúrate de que apunte a ese enlace o a tu IP.

**2. Levantar el Frontend y su Túnel**
Abre otras dos terminales:
```bash
# Terminal 3 (Servidor React)
npm run dev

# Terminal 4 (Túnel hacia React)
npx cloudflared tunnel --url http://localhost:5173
```
> [!TIP]
> Copia el enlace que te arroje la Terminal 4. ¡Ese es el enlace que debes abrir en tu celular (Safari o Chrome) y pulsar **"Agregar a la pantalla de inicio"**!
