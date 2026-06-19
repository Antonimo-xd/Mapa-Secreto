// Detectamos desde dónde estás abriendo la app
const hostActual = window.location.hostname;
const esLocal = hostActual === 'localhost' || hostActual === '127.0.0.1';

// Configuramos la URL dinámicamente
export const API_URL = esLocal 
  ? 'http://127.0.0.1:8000' 
  // 👇 ASEGÚRATE DE QUE ESTE SEA TU ENLACE ACTUAL DE CLOUDFLARE PARA EL PUERTO 8000 👇
  : 'https://francis-enter-forget-rangers.trycloudflare.com';