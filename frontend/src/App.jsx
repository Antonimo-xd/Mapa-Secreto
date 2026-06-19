import { useEffect, useState } from 'react';
import axios from 'axios';
import Mapa from './components/Mapa';
import LoginModal from './components/LoginModal';
import CrearTiendaModal from './components/CrearTiendaModal';
import CrearCategoriaModal from './components/CrearCategoriaModal';
import AdminDashboard from './components/AdminDashboard';
import { API_URL } from './config';
import GuardarRutaModal from './components/GuardarRutaModal';
import * as turf from '@turf/turf';

const obtenerTokenValido = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  try {
    // Los tokens JWT tienen 3 partes separadas por puntos. La del medio tiene los datos.
    // La decodificamos (atob) y leemos la fecha de expiración ('exp').
    const payload = JSON.parse(atob(token.split('.')[1]));
    const tiempoExpiracion = payload.exp * 1000; // Convertimos a milisegundos

    if (Date.now() >= tiempoExpiracion) {
      console.log("El token expiró. Cerrando sesión automáticamente.");
      localStorage.removeItem('access_token');
      return null;
    }
    return token; // Si sigue vivo, lo usamos
  } catch (error) {
    localStorage.removeItem('access_token');
    return null;
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

      await axios.post(`${API_URL}/api/rutas/`, payload, config);
      
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
    }
  }

    // 2. La llamamos una sola vez al cargar la página
    useEffect(() => {
      fetchData();
    }, []);

  // Filtrado dinámico
  const tiendasVisibles = tiendas.filter(t => {
    const cumpleBusqueda = t.nombre.toLowerCase().includes(busqueda.toLowerCase());

    let cumpleCat = true;
    // Si hay al menos un filtro seleccionado en nuestro array
    if (filtrosCat.length > 0) {
        if (Array.isArray(t.categorias)) {
            // Verificamos si la tienda tiene ALGUNA de las categorías seleccionadas
            cumpleCat = t.categorias.some(catId => filtrosCat.includes(catId));
        } 
        else if (t.categoria) {
            cumpleCat = filtrosCat.includes(t.categoria);
        }
        else {
            cumpleCat = false;
        }
    }

    return cumpleBusqueda && cumpleCat;
  });

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

  const latModal = coordsSeleccionadas ? coordsSeleccionadas.lat : (miUbicacion ? miUbicacion.lat : centroMapa.lat);
  const lngModal = coordsSeleccionadas ? coordsSeleccionadas.lng : (miUbicacion ? miUbicacion.lng : centroMapa.lng);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative w-full">
      {menuMovilAbierto && (
        <div 
          className="fixed inset-0 bg-black/60 z-[1999] md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMenuMovilAbierto(false)} // Si tocas el fondo oscuro, se cierra el menú
        />
      )}

      {/* SIDEBAR CON BUSCADOR Y FILTROS */}
      <aside className={`absolute md:relative z-[2000] md:z-20 w-[85%] sm:w-[340px] md:w-[340px] h-full bg-white shadow-2xl flex flex-col shrink-0 transition-transform duration-300 ease-in-out ${menuMovilAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* --- 1. ZONA SUPERIOR (FIJA): Cabecera, Buscador y Categorías --- */}
        <div className="p-6 pb-4 flex flex-col gap-5 shrink-0 shadow-sm z-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-blue-600 tracking-tight">📍 MAPA SECRETO</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">La Serena / Coquimbo</p>
            </div>

            <button 
              onClick={() => setMenuMovilAbierto(false)}
              className="md:hidden bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-gray-200 font-bold text-xs"
            >
              ✖
            </button>
          </div>

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

            {/* Contenedor de etiquetas con un sutil scroll interno si hay muchas */}
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
              <button 
                onClick={() => setFiltrosCat([])}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filtrosCat.length === 0 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                Todos
              </button>

              <button 
                onClick={() => setFiltrosCat(['NINGUNO'])}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filtrosCat.includes('NINGUNO') ? 'bg-slate-800 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                Ninguno
              </button>
              
              {categorias.map(cat => {
                const isSelected = filtrosCat.includes(cat.id);
                return (
                  <button 
                    key={cat.id}
                    onClick={() => toggleFiltroCategoria(cat.id)}
                    className={`group relative px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${isSelected ? 'shadow-md ring-2 ring-offset-1' : 'opacity-70 hover:opacity-100 bg-gray-50 border border-gray-100'}`}
                    style={{ backgroundColor: isSelected ? cat.color_hex : '', color: isSelected ? 'white' : '#6b7280', ringColor: cat.color_hex }}>
                    {cat.nombre}
                    {token && (
                      <span 
                        onClick={(e) => handleEditarCategoria(cat, e)}
                        className="ml-1 bg-white/20 hover:bg-white/40 rounded-full p-1 text-[10px] leading-none cursor-pointer"
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
        <div className="flex-1 overflow-y-auto p-6 pt-2 bg-gray-50/50 space-y-3">
          <div className="flex justify-between items-center mb-4">
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
                  if (window.innerWidth < 768) setMenuMovilAbierto(false); 
                }}
                className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all flex gap-3.5 group cursor-pointer"
              >
                {/* Miniatura un poco más grande */}
                {tienda.url_imagen ? (
                  <img 
                    src={tienda.url_imagen} 
                    alt={tienda.nombre} 
                    className="w-20 h-20 object-cover rounded-xl shrink-0 bg-gray-50 shadow-inner" 
                    onError={(e) => e.target.style.display = 'none'} 
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center shrink-0 text-3xl shadow-inner">
                    🏪
                  </div>
                )}
                
                <div className="flex-1 overflow-hidden flex flex-col justify-between py-0.5">
                  <div>
                    <h3 className="font-black text-sm text-gray-800 truncate group-hover:text-blue-600 transition-colors leading-tight mb-1">
                      {tienda.nombre}
                    </h3>
                    {tienda.direccion && (
                      <p className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                        <span>📍</span> {tienda.direccion}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-end mt-2 gap-2">
                    <div className="flex flex-wrap gap-1">
                      {tienda.categorias_detalle && tienda.categorias_detalle.map(cat => (
                        <span 
                          key={cat.id}
                          className="text-[9px] px-1.5 py-0.5 rounded-md text-white font-bold shadow-sm whitespace-nowrap" 
                          style={{ backgroundColor: cat.color_hex }}
                        >
                          {cat.nombre}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md shrink-0 border border-green-100">
                      {'$'.repeat(tienda.rango_precios || 1)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- 3. ZONA INFERIOR (FIJA): Footer Admin --- */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0 z-10">
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
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center gap-2">
                  <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border border-green-200 flex-1 text-center shadow-inner">
                    ● Admin Activo
                  </div>
                  <button 
                    onClick={() => { setToken(null); localStorage.removeItem('access_token'); }}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 text-xs font-bold py-2 px-3 rounded-lg transition-colors border border-transparent hover:border-red-100">
                    Salir
                  </button>
                </div>
                
                <button 
                  onClick={toggleTracking}
                  className={`w-full text-xs font-bold py-2.5 rounded-lg transition-all flex justify-center items-center gap-2 shadow-md ${isTracking ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse ring-2 ring-red-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                  <span>{isTracking ? '⏹️ Detener Grabación' : '⏺️ Empezar Recorrido'}</span>
                </button>

                <button 
                    onClick={toggleDrawing}
                    disabled={isTracking}
                    className={`flex-1 text-[10px] font-bold py-2.5 rounded-lg transition-all flex flex-col justify-center items-center gap-1 shadow-md disabled:opacity-50 ${isDrawing ? 'bg-orange-500 hover:bg-orange-600 text-white animate-pulse ring-2 ring-orange-300' : 'bg-slate-700 hover:bg-slate-800 text-white'}`}>
                    <span className="text-lg">{isDrawing ? '✅' : '✏️'}</span>
                    <span>{isDrawing ? 'Guardar Trazo' : 'Dibujo Manual'}</span>
                  </button>

                <button 
                  onClick={() => setIsDashboardOpen(true)}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-md">
                  <span>📈</span> Ver Panel de Métricas
                </button>

                <button 
                  onClick={() => setMostrarRutas(!mostrarRutas)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 border border-slate-200">
                  <span>{mostrarRutas ? '👁️ Ocultar Mis Rutas' : '👁️‍🗨️ Mostrar Mis Rutas'}</span>
                </button>
              </div>
            )}
        </div>
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
          rutaActual={rutaActual}
          rutas={rutas}
          onRutaEliminada={eliminarRuta}
          isDrawing={isDrawing}
          setRutaActual={setRutaActual}
          mostrarRutas={mostrarRutas}
          onCambiarEstadoRuta={cambiarEstadoRuta}
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
      />
      {/* Modales */}
      <GuardarRutaModal 
        isOpen={modalRutaAbierto}
        onClose={() => { setModalRutaAbierto(false); setRutaActual([]); }}
        onGuardar={guardarRuta}
        cantidadPuntos={rutaActual.length}
        coordenadaInicial={rutaActual.length > 0 ? rutaActual[0] : null}
      />

    </div>
  );
}

export default App;