# 🚀 Comandos para Iniciar el Servidor (Mapa Secreto)

Guarda este archivo como referencia rápida para encender tu entorno de desarrollo.

## Opción 1: Trabajar de forma local (Solo tú y tu WiFi)
Usa esta opción si solo estás programando y probando en tu propio computador o celular conectado a tu misma red WiFi.

**1. Levantar el Backend (Django)**
Abre una terminal, entra a la carpeta `backend` y ejecuta:
```bash
# Opcional: Activa tu entorno virtual si tienes uno, ej: venv\Scripts\activate
python manage.py runserver 0.0.0.0:8000
```

**2. Levantar el Frontend (React)**
Abre otra terminal, entra a la carpeta `frontend` y ejecuta:
```bash
npm run dev -- --host
```

---

## Opción 2: Trabajar de forma pública (Con Cloudflare Tunnels)
Usa esta opción si quieres compartir el proyecto con alguien en otra ciudad (a través de internet) o si quieres probar la **instalación de la PWA** en tu celular, ya que para instalar apps se requiere un enlace seguro `https://`.

Para que esto funcione correctamente sin "pantallas blancas", necesitas levantar **DOS** túneles (uno para los datos y otro para la vista).

**1. Levantar el Backend y su Túnel**
Abre dos terminales:
```bash
# Terminal 1 (Servidor Django)
python manage.py runserver

# Terminal 2 (Túnel hacia Django)
npx cloudflared tunnel --url http://localhost:8000
```
> [!IMPORTANT]
> Copia el enlace que te arroje la Terminal 2 (ej: `https://gatos.trycloudflare.com`). 
> Ve a tu archivo `frontend/src/config.js` y pega ese enlace en la variable `API_URL` (en la línea que dice "ASEGÚRATE DE QUE ESTE SEA TU ENLACE ACTUAL...").

**2. Levantar el Frontend y su Túnel**
Abre otras dos terminales:
```bash
# Terminal 3 (Servidor React)
npm run dev

# Terminal 4 (Túnel hacia React)
npx cloudflared tunnel --url http://localhost:5173
```
> [!TIP]
> Copia el enlace que te arroje la Terminal 4. ¡Ese es el enlace que debes abrir en tu celular o enviarle a tus amigos para que vean la app!
