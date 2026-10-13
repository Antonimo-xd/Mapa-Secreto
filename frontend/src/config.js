// Detecta automáticamente si estás entrando desde localhost, Tailscale o tu IP estática (192.168.100.75)
const hostname = window.location.hostname;
export const API_URL = `http://${hostname}:8000`;