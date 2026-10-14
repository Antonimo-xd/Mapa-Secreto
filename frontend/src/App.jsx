import { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import Mapa from './components/Mapa';
import LoginModal from './components/LoginModal';
import CrearTiendaModal from './components/CrearTiendaModal';
import CrearCategoriaModal from './components/CrearCategoriaModal';
import AdminDashboard from './components/AdminDashboard';
import { API_URL } from './config';
import GuardarRutaModal from './components/GuardarRutaModal';
import * as turf from '@turf/turf';
import { sincronizarColaOffline, agregarAColaOffline, obtenerCantidadTareasPendientes } from './utils/offlineQueue';

const obtenerTokenValido = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const tiempoExpiracion = payload.exp * 1000; 

    if (Date.now() >= tiempoExpiracion) {
      console.log("El token expiró. Cerrando sesión automáticamente.");
      localStorage.removeItem('access_token');
      return null;
    }
    return token; 
  } catch {
    localStorage.removeItem('access_token');
    return null;
  }
};

const THEMES = {
  boutique: {
    nombre: "Boutique",
    icono: "🕊️",
    mapUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    sidebarBg: "bg-white/85",
    textMain: "text-blue-600",
    textMuted: "text-gray-400",
    border: "border-gray-200",
    fontFamily: "'Outfit', sans-serif",
    cardBg: "bg-white/80 border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]",
    cardTextMain: "text-slate-800",
    cardTextSub: "text-slate-500",
    cardHoverTitle: "group-hover:text-blue-600"
  },
  cyberpunk: {
    nombre: "Cyberpunk",
    icono: "🌃",
    mapUrl: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    sidebarBg: "bg-slate-900/85",
    textMain: "text-cyan-400",
    textMuted: "text-slate-400",
    border: "border-slate-800",
    fontFamily: "'Space Grotesk', sans-serif",
    cardBg: "bg-slate-800/80 border-slate-700 shadow-lg shadow-black/50 hover:shadow-cyan-500/20 hover:border-cyan-500/50",
    cardTextMain: "text-cyan-50",
    cardTextSub: "text-slate-400",
    cardHoverTitle: "group-hover:text-cyan-400"
  },
  aventura: {
    nombre: "Aventura",
    icono: "🏕️",
    mapUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    sidebarBg: "bg-[#F4F1EA]/90",
    textMain: "text-[#4A5D23]",
    textMuted: "text-[#8B7355]",
    border: "border-[#E2D5C4]",
    fontFamily: "'Lora', serif",
    cardBg: "bg-[#FCFBF8]/90 border-[#E2D5C4] shadow-md hover:shadow-xl hover:border-[#8B7355]/50",
    cardTextMain: "text-[#3E4E1C]",
    cardTextSub: "text-[#8B7355]",
    cardHoverTitle: "group-hover:text-[#8B7355]"
  }
};

function App() {
  const [tiendas, setTiendas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtrosCat, setFiltrosCat] = useState([]);
  const [token, setToken] = useState(obtenerTokenValido());
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [tiendaParaEditar, setTiendaParaEditar] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [centroMapa, setCentroMapa] = useState({ lat: -29.9027, lng: -71.2520 }); // Valor inicial La Serena
  const [coordsSeleccionadas, setCoordsSeleccionadas] = useState(null);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [categoriaParaEditar, setCategoriaParaEditar] = useState(null);
  const [tiendaEnfocada, setTiendaEnfocada] = useState(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [rutaActual, setRutaActual] = useState([]);
  const [watchId, setWatchId] = useState(null);
  const [rutas, setRutas] = useState([]);
  const [modalRutaAbierto, setModalRutaAbierto] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mostrarRutas, setMostrarRutas] = useState(true); // Controla el "ojo" mágico
  const [modoTermico, setModoTermico] = useState(false); // <--- NUEVO: Estado del Heatmap
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [tareasPendientes, setTareasPendientes] = useState(0);
  const [modalCategoriasAbierto, setModalCategoriasAbierto] = useState(false); 
  const [modalAdminAbierto, setModalAdminAbierto] = useState(false); 
  const [temaActual, setTemaActual] = useState('boutique'); // <--- NUEVO: Estado del Tema
  const [fetchError, setFetchError] = useState(null);


  // === ESTADOS PARA DRAG-TO-SCROLL (Carrusel en PC) ===
  const carruselRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - carruselRef.current.offsetLeft);
    setScrollLeft(carruselRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - carruselRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Multiplicador de velocidad
    carruselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleWheel = (e) => {
    if (carruselRef.current) {
      carruselRef.current.scrollLeft += e.deltaY;
    }
  };

  // === MONITOR DE CONEXIÓN Y SINCRONIZACIÓN ===
  const actualizarTareasPendientes = async () => {
    const cantidad = await obtenerCantidadTareasPendientes();
    setTareasPendientes(cantidad);
  };

  useEffect(() => {
    actualizarTareasPendientes();
    
    const handleOnline = async () => {
      setIsOnline(true);
      const huboSincronizacion = await sincronizarColaOffline(token);
      if (huboSincronizacion) {
        fetchData(); // Recargamos para mostrar lo que se acaba de subir
        alert("¡Conexión recuperada! Se han sincronizado los datos guardados offline.");
      }
      actualizarTareasPendientes();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Intento inicial por si ya había tareas
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [token]);

  // === MOTOR DE TRACKING GPS ===
  const toggleTracking = () => {
    if (isTracking) {
      // 1. Apagar el GPS si ya estaba grabando
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
      setWatchId(null);
      
      // 2. Si caminaste lo suficiente (más de 2 puntos GPS), abrimos el modal
      if (rutaActual.length > 2) {
        setModalRutaAbierto(true);
      }
    } else {
      // 2. Encender el GPS
      if (!navigator.geolocation) {
        alert("Tu dispositivo o navegador no soporta GPS.");
        return;
      }
      
      setRutaActual([]); // Limpiamos la línea anterior
      setIsTracking(true);
      
      // watchPosition se dispara automáticamente cada vez que el celular se mueve
      const id = navigator.geolocation.watchPosition(
        (position) => {
          if (position.coords.accuracy > 25) {
            console.warn("Descartando punto de mala calidad. Error:", position.coords.accuracy, "metros");
            return; // Cortamos la función aquí, no lo dibujamos
          }

          const nuevaPos = [position.coords.latitude, position.coords.longitude];
          setRutaActual((prevRuta) => [...prevRuta, nuevaPos]); // Añadimos el paso a la línea
        },
        (error) => {
          console.error("Error de GPS:", error);
          alert("Asegúrate de darle permisos de ubicación a la página.");
          setIsTracking(false);
        },
        { 
          enableHighAccuracy: true, // ¡Clave! Fuerza a usar el chip GPS real, no solo el WiFi
          maximumAge: 0, 
          timeout: 5000 
        }
      );
      setWatchId(id);
    }
  };

  // === MODO DIBUJO MANUAL ===
  const toggleDrawing = () => {
    if (isDrawing) {
      // Apagamos el modo dibujo
      setIsDrawing(false);
      // Si el usuario marcó al menos 2 puntos (una línea recta), abrimos el modal
      if (rutaActual.length > 1) {
        setModalRutaAbierto(true);
      } else {
        setRutaActual([]); // Cancelamos si solo hizo 1 clic
      }
    } else {
      // Encendemos el modo dibujo
      setRutaActual([]); // Limpiamos el mapa
      setIsDrawing(true);
    }
  };

  const procesarRutaFinal = async (coordenadasCrudas) => {
    // Si la ruta es demasiado corta, no hacemos nada
    if (coordenadasCrudas.length < 3) return coordenadasCrudas;

    try {
      // Intentamos reducir la cantidad de puntos si son demasiados para OSRM
      let puntosAProcesar = coordenadasCrudas;
      if (coordenadasCrudas.length > 90) {
        const salto = Math.ceil(coordenadasCrudas.length / 90);
        puntosAProcesar = coordenadasCrudas.filter((_, index) => index % salto === 0);
      }

      const coordsString = puntosAProcesar.map(p => `${p[1]},${p[0]}`).join(';');
      const radiuses = puntosAProcesar.map(() => '30').join(';');

      // INTENTO A: OSRM (Inteligencia Artificial)
      const response = await axios.get(
        `https://router.project-osrm.org/match/v1/foot/${coordsString}?geometries=geojson&overview=full&radiuses=${radiuses}`
      );

      if (response.data.code === 'Ok' && response.data.matchings.length > 0) {
        console.log("¡Ruta enderezada con éxito por OSRM!");
        return response.data.matchings[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
      }
    } catch (error) {
      console.warn("Fallo en OSRM, pasando al Plan B (Turf.js)...", error);
    }
    
    // INTENTO B: TURF.JS (Rescate Estético si OSRM falla)
    console.log("Aplicando suavizado matemático con Turf.js...");
    try {
      // 1. Turf exige formato [Longitud, Latitud]
      const coordsParaTurf = coordenadasCrudas.map(p => [p[1], p[0]]);
      const linea = turf.lineString(coordsParaTurf);
      
      // 2. Aplicamos la curva de Bézier para matar los picos en zigzag
      const lineaSuavizada = turf.bezierSpline(linea, { resolution: 10000, sharpness: 0.85 });
      
      // 3. Devolvemos a formato [Latitud, Longitud] para Leaflet/Django
      return lineaSuavizada.geometry.coordinates.map(p => [p[1], p[0]]);
    } catch (errorTurf) {
      console.error("Error al suavizar con Turf:", errorTurf);
      return coordenadasCrudas; // Si todo explota, devolvemos el crudo
    }
  };

  // === GUARDAR RUTA EN LA BASE DE DATOS ===
  const guardarRuta = async (datosDesdeModal) => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      // 👇 MAGIA APLICADA AQUÍ 👇
      // Pausamos un segundo para enderezar el zigzag antes de guardarlo
      const rutaMapeada = await procesarRutaFinal(rutaActual);

      const payload = {
        nombre: datosDesdeModal.nombre,
        estado: datosDesdeModal.estado,
        coordenadas: rutaMapeada // <--- Guardamos la ruta perfecta, no la cruda
      };

      try {
        await axios.post(`${API_URL}/api/rutas/`, payload, config);
      } catch (err) {
        if (!navigator.onLine || err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
          await agregarAColaOffline(`${API_URL}/api/rutas/`, 'POST', payload, config.headers);
          alert("Sin conexión: La ruta se ha guardado en la memoria de tu celular. Se sincronizará automáticamente cuando vuelva el internet.");
          actualizarTareasPendientes();
        } else {
          throw err;
        }
      }
      
      // Limpiar y recargar
      setModalRutaAbierto(false);
      setRutaActual([]);
      fetchData(); 
      
    } catch (error) {
      console.error("Error al guardar ruta:", error);
      alert("Hubo un error al guardar. Revisa la consola.");
    }
  };

  // === ELIMINAR RUTA ===
  const eliminarRuta = async (idRuta) => {
    if (window.confirm("¿Estás seguro de eliminar esta ruta del mapa?")) {
      try {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        await axios.delete(`${API_URL}/api/rutas/${idRuta}/`, config);
        fetchData(); // Recargamos el mapa para que la línea desaparezca
      } catch (error) {
        console.error("Error al eliminar ruta:", error);
        alert("Hubo un error al eliminar. Revisa la consola.");
      }
    }
  };

  // === CAMBIAR ESTADO DE LA RUTA (Verde ↔ Amarillo) ===
  const cambiarEstadoRuta = async (ruta) => {
    try {
      // Si es verde, la hacemos amarilla, y viceversa
      const nuevoEstado = ruta.estado === 'verde' ? 'amarillo' : 'verde';
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      // Usamos PATCH para decirle a Django: "Solo actualiza este campo, deja el resto igual"
      await axios.patch(`${API_URL}/api/rutas/${ruta.id}/`, { estado: nuevoEstado }, config);
      
      fetchData(); // Recargamos para que el mapa cambie el color de la línea
    } catch (error) {
      console.error("Error al cambiar estado de la ruta:", error);
      alert("Hubo un error al actualizar. Revisa la consola.");
    }
  };

  const fetchData = async () => {
    try {
      setFetchError(null);
      const [resTiendas, resCats, resRutas] = await Promise.all([
        axios.get(`${API_URL}/api/tiendas/`),
        axios.get(`${API_URL}/api/categorias/`),
        axios.get(`${API_URL}/api/rutas/`)
      ]);
      setTiendas(resTiendas.data);
      setCategorias(resCats.data);
      setRutas(resRutas.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
      setFetchError(error.message || "Error desconocido al conectar con el servidor.");
    } finally {
      actualizarTareasPendientes();
    }
  }

    // 2. La llamamos una sola vez al cargar la página
    useEffect(() => {
      fetchData();
    }, []);

  const tiendasVisibles = useMemo(() => {
    return tiendas.filter(t => {
      // 1. Filtro por categoría
      if (filtrosCat.includes('NINGUNO')) return false;
      const pasaCategoria = filtrosCat.length === 0 || 
        (t.categorias_detalle && t.categorias_detalle.some(c => filtrosCat.includes(c.id)));
      if (!pasaCategoria) return false;

      // 2. Filtro por búsqueda de texto (nombre, dirección, descripción)
      if (!busqueda || !busqueda.trim()) return true;
      const q = busqueda.toLowerCase().trim();
      const coincideNombre = t.nombre && t.nombre.toLowerCase().includes(q);
      const coincideDireccion = t.direccion && t.direccion.toLowerCase().includes(q);
      const coincideDescripcion = t.descripcion && t.descripcion.toLowerCase().includes(q);

      return coincideNombre || coincideDireccion || coincideDescripcion;
    });
  }, [tiendas, filtrosCat, busqueda]);

  const toggleFiltroCategoria = (id) => {
    setFiltrosCat(prev => {
      // 1. Si el mapa estaba ocultando todo ("NINGUNO"), empezamos con una lista limpia
      const prevLimpio = prev.includes('NINGUNO') ? [] : prev;
      
      // 2. Lógica normal de agregar/quitar
      if (prevLimpio.includes(id)) {
        return prevLimpio.filter(catId => catId !== id);
      } else {
        return [...prevLimpio, id];
      }
    });
  };

  const handleEditarTienda = (tienda) => {
    setTiendaParaEditar(tienda);
    setIsCreateOpen(true);
  };

  const handleCrearTienda = () => {
    setTiendaParaEditar(null);
    setIsCreateOpen(true);
  };

  const handleCrearCategoria = () => {
    setCategoriaParaEditar(null); // Modo Crear
    setIsCatModalOpen(true);
  };

  const handleEditarCategoria = (cat, e) => {
    e.stopPropagation(); 
    setCategoriaParaEditar(cat); 
    setIsCatModalOpen(true);
  };

  const handleCerrarDetalle = () => {
    setTiendaEnfocada(null);
  };

  const handleMarkerClick = (tienda) => {
    setTiendaEnfocada(tienda);
    setMenuMovilAbierto(true);
  };

  const latModal = coordsSeleccionadas ? coordsSeleccionadas.lat : (miUbicacion ? miUbicacion.lat : centroMapa.lat);
  const lngModal = coordsSeleccionadas ? coordsSeleccionadas.lng : (miUbicacion ? miUbicacion.lng : centroMapa.lng);

  return (
    <div className="flex h-screen bg-transparent overflow-hidden relative w-full transition-colors duration-500" style={{ fontFamily: THEMES[temaActual].fontFamily }}>
      {menuMovilAbierto && (
        <div 
          className="fixed inset-0 bg-black/60 z-[1999] md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMenuMovilAbierto(false)} // Si tocas el fondo oscuro, se cierra el menú
        />
      )}

      {/* SIDEBAR / BOTTOM SHEET */}
      <aside className={`
        fixed md:relative z-[2000] md:z-20 
        bottom-0 md:bottom-auto md:left-0
        w-full md:w-[360px] 
        h-[85vh] md:h-full 
        rounded-t-3xl md:rounded-none
        shadow-[0_-10px_40px_rgba(0,0,0,0.3)] md:shadow-2xl 
        flex flex-col shrink-0 
        transition-transform duration-300 ease-in-out 
        backdrop-blur-xl 
        ${THEMES[temaActual].sidebarBg} 
        md:border-r border-t md:border-t-0 ${THEMES[temaActual].border} 
        ${menuMovilAbierto ? 'translate-y-0 md:translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-0'}
      `}>
        {/* Handle Mobile */}
        <div 
          className="w-full flex justify-center py-3 md:hidden shrink-0 cursor-pointer" 
          onClick={() => setMenuMovilAbierto(false)}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {tiendaEnfocada ? (
          // === VISTA DE DETALLE DE TIENDA ===
          <div className="flex flex-col h-full overflow-hidden fade-in">
            <div className="px-5 py-3 shrink-0 flex items-center justify-between border-b border-gray-200/50">
              <button onClick={handleCerrarDetalle} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                Volver
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0 pb-20 scrollbar-hide">
              {/* Image Header */}
              <div className="relative w-full h-56 bg-gray-100">
                {(tiendaEnfocada.imagen || tiendaEnfocada.url_imagen) ? (
                  <img src={tiendaEnfocada.imagen ? tiendaEnfocada.imagen : tiendaEnfocada.url_imagen} alt={tiendaEnfocada.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">🏪</div>
                )}
                {/* Categories overlapping image */}
                <div className="absolute bottom-3 left-4 flex flex-wrap gap-2">
                  {tiendaEnfocada.categorias_detalle && tiendaEnfocada.categorias_detalle.map(cat => (
                    <span key={cat.id} className="text-[10px] px-3 py-1 rounded-full text-white font-black shadow-md backdrop-blur-sm tracking-wider uppercase" style={{ backgroundColor: cat.color_hex }}>{cat.nombre}</span>
                  ))}
                </div>
              </div>
              
              {/* Info Body */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h1 className={`text-2xl font-black leading-tight ${THEMES[temaActual].cardTextMain}`}>{tiendaEnfocada.nombre}</h1>
                  <span className="text-emerald-600 font-black text-sm shrink-0 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">{'$'.repeat(tiendaEnfocada.rango_precios || 1)}</span>
                </div>
                
                {tiendaEnfocada.descripcion && (
                  <p className={`text-sm mb-5 italic ${THEMES[temaActual].cardTextSub}`}>"{tiendaEnfocada.descripcion}"</p>
                )}
                
                <div className="space-y-3 mb-6 bg-black/5 p-4 rounded-2xl">
                  {tiendaEnfocada.direccion && (
                    <div className="flex gap-3 items-start">
                      <span className="text-xl">📍</span>
                      <p className={`text-sm font-medium ${THEMES[temaActual].cardTextMain}`}>{tiendaEnfocada.direccion}</p>
                    </div>
                  )}
                  {tiendaEnfocada.horarios?.general && (
                    <div className="flex gap-3 items-start">
                      <span className="text-xl">🕒</span>
                      <p className={`text-sm font-medium ${THEMES[temaActual].cardTextMain}`}>{tiendaEnfocada.horarios.general}</p>
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${tiendaEnfocada.latitud},${tiendaEnfocada.longitud}`} target="_blank" rel="noreferrer" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3.5 rounded-xl font-black text-sm shadow-lg mb-4 transition-colors flex items-center justify-center gap-2">
                  <span className="text-xl">🚗</span> ¡Cómo llegar!
                </a>
                
                {(tiendaEnfocada.contacto?.ig || tiendaEnfocada.contacto?.whatsapp || tiendaEnfocada.contacto?.web) && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {tiendaEnfocada.contacto.ig && (
                      <a href={`https://instagram.com/${tiendaEnfocada.contacto.ig.replace('@', '')}`} target="_blank" rel="noreferrer" className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white text-xs py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition-transform"><span>📸</span> Instagram</a>
                    )}
                    {tiendaEnfocada.contacto.whatsapp && (
                      <a href={`https://wa.me/${tiendaEnfocada.contacto.whatsapp.replace('+', '')}`} target="_blank" rel="noreferrer" className="bg-green-500 text-white text-xs py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition-transform"><span>💬</span> WhatsApp</a>
                    )}
                    {tiendaEnfocada.contacto.web && (
                      <a href={tiendaEnfocada.contacto.web.startsWith('http') ? tiendaEnfocada.contacto.web : `https://${tiendaEnfocada.contacto.web}`} target="_blank" rel="noreferrer" className="col-span-2 bg-slate-800 text-white text-xs py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition-transform"><span>🌐</span> Sitio Web</a>
                    )}
                  </div>
                )}
                
                {token && (
                  <div className="flex gap-2 pt-4 border-t border-gray-200 mt-4">
                    <button onClick={() => handleEditarTienda(tiendaEnfocada)} className="flex-1 bg-orange-50 text-orange-600 border border-orange-200 text-sm font-bold py-2.5 rounded-xl transition-colors hover:bg-orange-100">✏️ Editar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // === VISTA NORMAL DE BUSQUEDA Y LISTA ===
          <>
            {/* --- 1. ZONA SUPERIOR (FIJA): Cabecera, Buscador y Categorías --- */}
            <div className="px-6 pb-4 flex flex-col gap-5 shrink-0 shadow-sm z-10 pt-2 md:pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className={`text-2xl font-black tracking-tight flex items-center gap-2 ${THEMES[temaActual].textMain}`}>
                    📍 MAPA SECRETO
                    {!isOnline && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse" title="Sin conexión">Offline</span>}
                    {(isOnline && tareasPendientes > 0) && <span className="text-[10px] bg-yellow-500 text-white px-2 py-0.5 rounded-full" title="Sincronizando...">⏳ {tareasPendientes}</span>}
                  </h1>
                  
                  <div className="flex justify-between items-center mt-2">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${THEMES[temaActual].textMuted}`}>La Serena / Coquimbo</p>
                    
                    {/* Selector de Temas */}
                    <div className="flex gap-1 bg-black/5 p-1 rounded-full">
                      {Object.entries(THEMES).map(([key, theme]) => (
                        <button
                          key={key}
                          onClick={() => setTemaActual(key)}
                          title={theme.nombre}
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm transition-all ${temaActual === key ? 'ring-2 ring-blue-500 scale-110 bg-white opacity-100 grayscale-0' : 'hover:scale-110 grayscale opacity-50'}`}
                        >
                          {theme.icono}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setMenuMovilAbierto(false)}
                  className="md:hidden bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-gray-200 font-bold text-xs"
                >
                  ✖
                </button>
              </div>

              {fetchError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">Error de conexión: </strong>
                  <span className="block sm:inline">{fetchError}</span>
                  <p className="text-xs mt-1">Revisa que la API esté corriendo en {API_URL}</p>
                </div>
              )}

              {/* Buscador */}
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Buscar por nombre..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-sm shadow-inner"
                  onChange={(e) => setBusqueda(e.target.value)} />
              </div>

              {/* Filtros de Categoría */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider">Categorías</h2>
                  {token && (
                    <button 
                      onClick={handleCrearCategoria}
                      className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 font-bold transition-colors"
                    >
                      + Nueva
                    </button>
                  )}
                </div>

                {/* Contenedor de etiquetas con SCROLL HORIZONTAL (Carrusel) */}
                <div 
                  ref={carruselRef}
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  onWheel={handleWheel}
                  className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide cursor-grab active:cursor-grabbing select-none"
                >
                  <button 
                    onClick={() => setFiltrosCat([])}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ${filtrosCat.length === 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    Todos
                  </button>

                  <button 
                    onClick={() => setFiltrosCat(['NINGUNO'])}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ${filtrosCat.includes('NINGUNO') ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/30' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    Ocultar
                  </button>

                  <button 
                    onClick={() => setModalCategoriasAbierto(true)}
                    className="shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200">
                    🔍 Ver Todas
                  </button>
                  
                  {categorias.map(cat => {
                    const isSelected = filtrosCat.includes(cat.id);
                    return (
                      <button 
                        key={cat.id}
                        onClick={() => toggleFiltroCategoria(cat.id)}
                        className={`shrink-0 group relative px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${isSelected ? 'shadow-lg ring-2 ring-offset-2' : 'opacity-80 hover:opacity-100 bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                        style={{ backgroundColor: isSelected ? cat.color_hex : '', color: isSelected ? 'white' : '#475569', ringColor: cat.color_hex, shadowColor: cat.color_hex }}>
                        {cat.nombre}
                        {token && (
                          <span 
                            onClick={(e) => handleEditarCategoria(cat, e)}
                            className="ml-1 bg-black/10 hover:bg-black/20 rounded-full p-1 text-[9px] leading-none cursor-pointer backdrop-blur-sm transition-colors"
                            title="Editar">
                            ✎
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* --- 2. ZONA CENTRAL (SCROLLABLE): Lista de Tiendas --- */}
            <div className="flex-1 overflow-y-auto p-5 bg-gradient-to-b from-gray-50 to-gray-100 space-y-4">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider">Lugares Encontrados</h2>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                  {tiendasVisibles.length}
                </span>
              </div>
              
              {tiendasVisibles.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-white border border-gray-100 rounded-2xl border-dashed">
                  <p className="text-4xl mb-3">🕵️‍♂️</p>
                  <p className="text-xs font-bold uppercase tracking-wider">No hay tiendas aquí</p>
                </div>
              ) : (
                tiendasVisibles.map(tienda => (
                  <div 
                    key={tienda.id} 
                    onClick={() => {
                      setTiendaEnfocada(tienda);
                    }}
                    className={`backdrop-blur-md border rounded-[1.25rem] p-3 hover:-translate-y-0.5 transition-all flex gap-4 group cursor-pointer relative overflow-hidden ${THEMES[temaActual].cardBg}`}
                  >
                    {/* Degradado lateral sutil */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {/* Miniatura Premium */}
                    <div className="relative shrink-0">
                      {(tienda.imagen || tienda.url_imagen) ? (
                        <img 
                          src={tienda.imagen ? tienda.imagen : tienda.url_imagen} 
                          alt={tienda.nombre} 
                          className="w-24 h-24 object-cover rounded-2xl shadow-sm group-hover:scale-105 transition-transform duration-300" 
                          onError={(e) => e.target.style.display = 'none'} 
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-105 transition-transform duration-300 text-slate-800">
                          🏪
                        </div>
                      )}
                      {tienda.verificado && (
                        <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-md">
                          <span className="text-blue-500 text-sm" title="Lugar Verificado">✅</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-hidden flex flex-col justify-between py-1">
                      <div>
                        <h3 className={`font-black text-[15px] truncate transition-colors tracking-tight ${THEMES[temaActual].cardTextMain} ${THEMES[temaActual].cardHoverTitle}`}>
                          {tienda.nombre}
                        </h3>
                        {tienda.direccion && (
                          <p className={`text-[10px] truncate flex items-center gap-1 mt-0.5 font-medium ${THEMES[temaActual].cardTextSub}`}>
                            <span className="opacity-70">📍</span> {tienda.direccion}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-end mt-2 gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {tienda.categorias_detalle && tienda.categorias_detalle.map(cat => (
                            <span 
                              key={cat.id}
                              className="text-[9px] px-2 py-0.5 rounded-full text-white font-black uppercase tracking-widest shadow-sm whitespace-nowrap" 
                              style={{ backgroundColor: cat.color_hex }}
                            >
                              {cat.nombre}
                            </span>
                          ))}
                        </div>
                        <span className="text-[11px] font-black text-emerald-600 bg-emerald-50/80 px-2 py-1 rounded-lg shrink-0 border border-emerald-100/50 shadow-sm">
                          {'$'.repeat(tienda.rango_precios || 1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* --- 3. ZONA INFERIOR (FIJA): Footer Admin --- */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0 z-10 shadow-[0_-4px_20px_rgb(0,0,0,0.03)]">
              {!token ? (
                <button 
                  onClick={() => setIsLoginOpen(true)}
                  className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-blue-600 text-xs font-bold p-2 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Acceso Administrador
                </button>
              ) : (
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => setModalAdminAbierto(true)}
                    className="flex-1 bg-slate-900 text-white font-black text-sm py-3 rounded-xl shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    <span>⚙️</span> Herramientas Admin
                  </button>
                  <button 
                    onClick={() => { setToken(null); localStorage.removeItem('access_token'); }} 
                    className="px-4 bg-red-50 text-red-600 font-bold text-xs rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    Salir
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      {/* MAPA PRINCIPAL */}
      <main className="flex-1 relative w-full h-full">
        <button
          onClick={() => setMenuMovilAbierto(true)}
          className="md:hidden absolute top-4 left-4 z-[1000] bg-white text-blue-700 px-4 py-3 rounded-2xl shadow-xl border border-blue-100 flex items-center gap-2 font-black text-xs uppercase tracking-wider"
        >
          <span className="text-lg">🔍</span> Buscar Lugares
        </button>

        <Mapa 
          tiendas={tiendasVisibles} 
          categorias={categorias} 
          setCentro={setCentroMapa} 
          token={token} // <--- Necesario para mostrar botón eliminar
          onTiendaEliminada={fetchData} // <--- Acción al eliminar
          setCoordsSeleccionadas={setCoordsSeleccionadas} // <--- Para guardar el click
          coordsSeleccionadas={coordsSeleccionadas} // <--- Para dibujar el pin fantasma
          onEditar={handleEditarTienda} // <--- NUEVA PROP: Pasamos la función de editar
          setMiUbicacion={setMiUbicacion} // <--- Para actualizar la ubicación desde el Localizador
          tiendaEnfocada={tiendaEnfocada} // <--- NUEVO: Le pasamos la tienda seleccionada al mapa
          onMarkerClick={handleMarkerClick} // <--- NUEVO: Abrir bottom sheet al clickear marcador
          rutaActual={rutaActual}
          rutas={rutas}
          onRutaEliminada={eliminarRuta}
          isDrawing={isDrawing}
          setRutaActual={setRutaActual}
          mostrarRutas={mostrarRutas}
          onCambiarEstadoRuta={cambiarEstadoRuta}
          modoTermico={modoTermico} 
          urlMapa={THEMES[temaActual].mapUrl} // <--- NUEVO: URL del Mapa Dinámico
        />

        {/* BOTÓN FLOTANTE DE AGREGAR (Solo visible si hay token) */}
        {token && (
          <button
            onClick={handleCrearTienda}
            className="absolute bottom-8 right-8 z-[1000] bg-blue-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 hover:scale-105 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>

        )}
      </main>

      {/* Modales */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLoginSuccess={(newToken) => setToken(newToken)} 
      />
      <CrearTiendaModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        categorias={categorias}
        latitud={latModal}
        longitud={lngModal}
        token={token}
        onTiendaCreada={fetchData}
        tiendaAEditar={tiendaParaEditar} 
      />
      <CrearCategoriaModal 
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        token={token}
        onCategoriaCreada={fetchData} // Reutilizamos fetchData para actualizar la lista al instante
        categoriaAEditar={categoriaParaEditar}
      />
      <AdminDashboard 
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        tiendas={tiendas}
        rutas={rutas}
      />
      {/* Modales */}
      <GuardarRutaModal 
        isOpen={modalRutaAbierto}
        onClose={() => { setModalRutaAbierto(false); setRutaActual([]); }}
        onGuardar={guardarRuta}
        cantidadPuntos={rutaActual.length}
        coordenadaInicial={rutaActual.length > 0 ? rutaActual[0] : null}
      />

        {/* --- MODAL PARA VER TODAS LAS CATEGORÍAS --- */}
        {modalCategoriasAbierto && (
          <div className="fixed inset-0 bg-black/60 z-[3000] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 flex justify-between items-center shrink-0">
                <h2 className="text-white font-bold text-lg">🔍 Todas las Categorías</h2>
                <button onClick={() => setModalCategoriasAbierto(false)} className="text-white/70 hover:text-white font-bold text-xl leading-none px-2">
                  ✕
                </button>
              </div>
              <div className="p-5 overflow-y-auto bg-gray-50 flex-1">
                <div className="flex flex-wrap gap-2.5 justify-center">
                  {categorias.map(cat => {
                    const isSelected = filtrosCat.includes(cat.id);
                    return (
                      <button 
                        key={cat.id}
                        onClick={() => toggleFiltroCategoria(cat.id)}
                        className={`group relative px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${isSelected ? 'shadow-md ring-2 ring-offset-2 scale-105' : 'opacity-80 hover:opacity-100 bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow'}`}
                        style={{ backgroundColor: isSelected ? cat.color_hex : '', color: isSelected ? 'white' : '#475569', ringColor: cat.color_hex }}>
                        {cat.nombre}
                        {isSelected && <span className="text-[10px]">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                <button 
                  onClick={() => setModalCategoriasAbierto(false)} 
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-colors">
                  Listo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL DE HERRAMIENTAS ADMIN --- */}
        {modalAdminAbierto && (
          <div className="fixed inset-0 bg-black/60 z-[3000] flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-slide-up">
              <div className="p-5 bg-gradient-to-r from-slate-800 to-slate-900 flex justify-between items-center shrink-0">
                <h2 className="text-white font-black text-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Herramientas Avanzadas
                </h2>
                <button onClick={() => setModalAdminAbierto(false)} className="text-white/70 hover:text-white font-bold text-xl leading-none px-2">
                  ✕
                </button>
              </div>
              
              <div className="p-6 bg-gray-50 space-y-5 flex-1 overflow-y-auto">
                
                {/* RUTAS Y GPS */}
                <div className="space-y-2.5">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rutas y GPS</h3>
                  <button 
                    onClick={() => { toggleTracking(); setModalAdminAbierto(false); }}
                    className={`w-full text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${isTracking ? 'bg-red-500 hover:bg-red-600 animate-pulse-soft' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    <span>{isTracking ? '⏹️ Detener y Guardar Recorrido' : '⏺️ Empezar Recorrido GPS'}</span>
                  </button>

                  <button 
                    onClick={() => { toggleDrawing(); setModalAdminAbierto(false); }}
                    className={`w-full font-bold py-3 rounded-xl transition-all shadow-sm border flex items-center justify-center gap-2 ${isDrawing ? 'bg-orange-500 text-white border-orange-600' : 'bg-slate-700 text-white border-slate-800 hover:bg-slate-600'}`}>
                    <span>{isDrawing ? '💾 Guardar Trazo Manual' : '✏️ Dibujar Ruta Manual'}</span>
                  </button>
                </div>

                {/* ANÁLISIS */}
                <div className="space-y-2.5">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análisis y Visibilidad</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button 
                      onClick={() => { setIsDashboardOpen(true); setModalAdminAbierto(false); }}
                      className="bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-sm">
                      <span>📈</span> Métricas
                    </button>

                    <button 
                      onClick={() => { setModoTermico(!modoTermico); setModalAdminAbierto(false); }}
                      className={`text-sm font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-sm border ${modoTermico ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                      <span>🔥</span> {modoTermico ? 'Calor ON' : 'Calor OFF'}
                    </button>
                  </div>

                  <button 
                    onClick={() => { setMostrarRutas(!mostrarRutas); setModalAdminAbierto(false); }}
                    className="w-full bg-white hover:bg-gray-50 text-slate-700 text-sm font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 border border-gray-200 shadow-sm">
                    <span>{mostrarRutas ? '👁️ Ocultar Mis Rutas' : '👁️‍🗨️ Mostrar Mis Rutas'}</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

    </div>
  );
}

export default App;