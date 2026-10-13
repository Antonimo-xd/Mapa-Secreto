import { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, CircleMarker, Polyline} from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { API_URL } from '../config';

const crearIconoCluster = (cluster) => {
  const cantidad = cluster.getChildCount(); // Cuenta cuántas tiendas hay en este grupo
  
  // Usamos estilos en línea puros para asegurarnos de que Leaflet los dibuje perfecto
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(to right, #2563eb, #4f46e5); 
        color: white; 
        font-size: 11px; 
        font-weight: 900; 
        padding: 6px 14px; 
        border-radius: 20px; 
        border: 2px solid white; 
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        🏬 ${cantidad} lugares
      </div>
    `,
    className: '', // ¡Importante! Esto borra el círculo verde/amarillo por defecto
    iconSize: [95, 30], // Ancho y alto aproximado de nuestra píldora
    iconAnchor: [47, 15] // Para que quede centrado exactamente en la coordenada
  });
};

// 1. Controlador de Zoom Inteligente
function ControladorMapa({ tiendas }) {
  const map = useMap();
  const idsFirmaRef = useRef(""); 

  const tiendasValidas = tiendas.filter(t => 
    t.latitud && t.longitud && !isNaN(parseFloat(t.latitud)) && !isNaN(parseFloat(t.longitud))
  );

  useEffect(() => {
    if (tiendasValidas.length === 0) return; // Si no hay tiendas válidas, no hacemos nada
    
    const firmaActual = tiendasValidas.map(t => t.id).sort((a, b) => a - b).join('-');

    if (idsFirmaRef.current === firmaActual) return;
    idsFirmaRef.current = firmaActual;

    if (tiendasValidas.length === 1) {
      const { latitud, longitud } = tiendasValidas[0];
      map.flyTo([parseFloat(latitud), parseFloat(longitud)], 16, { duration: 1.5 });
    } else {
      const bounds = L.latLngBounds(tiendasValidas.map(t => [parseFloat(t.latitud), parseFloat(t.longitud)]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [80, 80] }); 
      }
    }
  }, [tiendasValidas, map]); // Usamos tiendasValidas aquí

  return null;
}

// 2. Botón de Geolocalización
function Localizador({ setMiUbicacion }) { // <--- 1. Añadimos el prop aquí
  const map = useMap();
  const [posicion, setPosicion] = useState(null);

  // 2. NUEVO: Empezar a buscar el GPS silenciosamente en segundo plano al cargar
  useEffect(() => {
    map.locate({ watch: true, setView: false });
  }, [map]);

  const manejarClick = () => {
    // Si ya tenemos la posición, volamos hacia ella, si no, forzamos la búsqueda
    if (posicion) {
      map.flyTo(posicion, 18);
    } else {
      map.locate({ setView: true, maxZoom: 18, watch: true }); 
    }
  };

  useMapEvents({
    locationfound(e) {
      setPosicion(e.latlng);
      if (setMiUbicacion) setMiUbicacion(e.latlng); // <--- 3. Enviamos el GPS a App.jsx
    },
    locationerror(e) {
      console.warn("Error de GPS:", e.message);
    },
  });

  return (
    <>
      <button
        onClick={manejarClick}
        className="absolute top-24 right-4 z-[1000] bg-white text-blue-600 p-3 rounded-full shadow-lg border-2 border-white hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center"
        title="Ir a mi ubicación">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      </button>

      {posicion && (
        <>
          <CircleMarker center={posicion} radius={20} pathOptions={{ color: 'transparent', fillColor: '#3b82f6', fillOpacity: 0.2 }} />
          <CircleMarker center={posicion} radius={8} pathOptions={{ color: 'white', weight: 2, fillColor: '#2563eb', fillOpacity: 1 }}>
            <Popup><div className="text-center"><strong>¡Estás aquí!</strong></div></Popup>
          </CircleMarker>
        </>
      )}
    </>
  );
}

// 3. Selector con DOBLE CLIC (Modificado)
function SelectorUbicacion({ setCoordsSeleccionadas, token }) {
  const map = useMap();

  // TRUCO: Si eres admin, desactivamos el zoom con doble clic para que puedas poner pines sin que el mapa se acerque
  useEffect(() => {
    if (token) {
      map.doubleClickZoom.disable();
    } else {
      map.doubleClickZoom.enable();
    }
    // Al desmontar o salir de modo admin, reactivamos el zoom normal
    return () => map.doubleClickZoom.enable();
  }, [token, map]);

  useMapEvents({
    // CAMBIO: Ahora escuchamos 'dblclick' en lugar de 'click'
    dblclick(e) {
      if (token) { 
        setCoordsSeleccionadas(e.latlng);
      }
    },
  });
  return null;
}

// Detector de Movimiento eliminado para mejorar rendimiento y evitar bucles.

// 5. Piloto Automático (Vuela a la tienda seleccionada)
function VueloATienda({ tiendaEnfocada }) {
  const map = useMap();

  useEffect(() => {
    if (tiendaEnfocada) {
      const lat = parseFloat(tiendaEnfocada.latitud);
      const lng = parseFloat(tiendaEnfocada.longitud);
      // Si las coordenadas son válidas, volamos hacia allá con un zoom de 19
      if (!isNaN(lat) && !isNaN(lng)) {
        map.flyTo([lat, lng], 19, { duration: 1.5 });
      }
    }
  }, [tiendaEnfocada, map]);

  return null;
}

// 6. Detector de Clics para Dibujo Manual
function EventosDibujo({ isDrawing, setRutaActual }) {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        // Cada vez que haces clic, guarda la coordenada para trazar la línea
        setRutaActual(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
      }
    }
  });
  return null;
}

// 7. Capa de Mapa de Calor (Heatmap)
function CapaHeatmap({ tiendas, modoTermico }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!modoTermico) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    const initHeatmap = async () => {
      try {
        if (!L.heatLayer) {
          window.L = L; 
          await import('leaflet.heat');
        }

        const puntosHeatmap = tiendas
          .filter(t => !isNaN(parseFloat(t.latitud)) && !isNaN(parseFloat(t.longitud)))
          .map(t => [parseFloat(t.latitud), parseFloat(t.longitud), 1]); 

        if (puntosHeatmap.length > 0) {
          heatLayerRef.current = L.heatLayer(puntosHeatmap, {
            radius: 35,
            blur: 25,
            maxZoom: 16,
            gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
          }).addTo(map);
        }
      } catch (error) {
        console.error("Error cargando leaflet.heat:", error);
      }
    };

    initHeatmap();

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [modoTermico, map, tiendas]);

  return null;
}

// === COMPONENTE PRINCIPAL ===
const POSICION_LA_SERENA = [-29.9027, -71.2520];

const Mapa = ({ tiendas, categorias, setCentro, token, onTiendaEliminada, setCoordsSeleccionadas, coordsSeleccionadas, onEditar, setMiUbicacion, tiendaEnfocada, rutaActual, rutas, onRutaEliminada, isDrawing, setRutaActual, mostrarRutas, onCambiarEstadoRuta, modoTermico, urlMapa }) => {
  const marcadoresRef = useRef({});

  // Leaflet Popup automations removed since we now show details in the Sidebar/BottomSheet

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta tienda permanentemente?")) return;
    try {
      await axios.delete(`${API_URL}/api/tiendas/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onTiendaEliminada) onTiendaEliminada();
    } catch (error) {
      console.error("Error al eliminar tienda", error);
      alert("Hubo un error al eliminar. Revisa tu conexión o sesión.");
    }
  };

  const obtenerIcono = (tienda) => {
    // 1. Buscamos si la tienda tiene categorías
    let color = '#3b82f6'; // Azul default
    
    // Si la API nos manda el detalle (nueva versión) y hay al menos una
    if (tienda.categorias_detalle && tienda.categorias_detalle.length > 0) {
      color = tienda.categorias_detalle[0].color_hex; // Usamos el color de la PRIMERA categoría
    } 
    // Fallback por si acaso usamos la lógica antigua
    else if (tienda.categoria) {
      const cat = categorias?.find(c => c.id === tienda.categoria);
      if (cat) color = cat.color_hex;
    }
    
    return L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: ${color}; width: 15px; height: 15px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
      iconSize: [15, 15],
      iconAnchor: [7, 7]
    });
  };

  const iconoSeleccion = L.divIcon({
    html: '<div style="font-size: 24px; filter: drop-shadow(2px 4px 6px black);">📍</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'marker-selection'
  });


  return (
    <MapContainer center={POSICION_LA_SERENA} zoom={18} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      <TileLayer 
        maxZoom={19} 
        url={urlMapa || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} 
      />
      
      <Localizador setMiUbicacion={setMiUbicacion} />
      <ControladorMapa tiendas={tiendas} />
      <SelectorUbicacion setCoordsSeleccionadas={setCoordsSeleccionadas} token={token} />
      <VueloATienda tiendaEnfocada={tiendaEnfocada} />
      <EventosDibujo isDrawing={isDrawing} setRutaActual={setRutaActual} />
      {/* 👇 LÍNEA ROJA EN VIVO (Mientras caminas) 👇 */}
      {rutaActual && rutaActual.length > 1 && (
        <Polyline 
          positions={rutaActual} 
          color="#ef4444" 
          weight={5} 
          dashArray="10, 10" 
          className="animate-pulse" 
        />
      )}
      {token && mostrarRutas && rutas && rutas.map((ruta) => {
        const colorLinea = ruta.estado === 'verde' ? '#10b981' : '#f59e0b'; // Esmeralda o Ambar
        
        return (
          <Polyline 
            key={`${ruta.id}-${ruta.estado}`}
            positions={ruta.coordenadas} 
            color={colorLinea} 
            weight={6} 
            opacity={0.8}
            pathOptions={{ lineCap: 'round', lineJoin: 'round' }}
          >
            {/* PopUp Profesional con opciones */}
            <Popup>
              <div className="text-center p-2 min-w-[150px]">
                <p className="font-bold text-sm mb-1">{ruta.nombre}</p>
                <p className="text-[10px] text-gray-500 uppercase mb-3 font-bold">
                  Estado: <span className={ruta.estado === 'verde' ? 'text-green-600' : 'text-yellow-600'}>{ruta.estado}</span>
                </p>
                
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onCambiarEstadoRuta(ruta); }}
                    className={`text-xs font-bold py-2 px-2 rounded-lg text-white transition-colors shadow-sm ${ruta.estado === 'verde' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
                  >
                    {ruta.estado === 'verde' ? '🟡 Marcar Incompleto' : '🟢 Marcar Completado'}
                  </button>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); onRutaEliminada(ruta.id); }}
                    className="text-xs font-bold py-1.5 px-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                  >
                    🗑️ Eliminar Ruta
                  </button>
                </div>
              </div>
            </Popup>
          </Polyline>
        );
      })}

      {/* Pin Fantasma (Doble Click para Borrar) */}
      {coordsSeleccionadas && token && (
        <Marker 
          position={coordsSeleccionadas} 
          icon={iconoSeleccion} 
          opacity={0.7}
          eventHandlers={{
            dblclick: (e) => {
              e.originalEvent.stopPropagation(); // Evita el zoom al borrar
              setCoordsSeleccionadas(null); 
            }
          }}
        >
          <Popup>
            <div className="text-center">
              <p className="font-bold mb-2">¿Ubicar tienda aquí?</p>
              <button 
                onClick={() => setCoordsSeleccionadas(null)}
                className="text-red-500 text-xs font-bold border border-red-200 bg-red-50 px-2 py-1 rounded hover:bg-red-100"
              >
                ✖ Quitar marcador
              </button>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Capa de Mapa de Calor */}
      <CapaHeatmap tiendas={tiendas} modoTermico={modoTermico} />

      {/* Solo mostramos los pines si NO estamos en Modo Térmico */}
      {useMemo(() => (
        !modoTermico && (
          <MarkerClusterGroup 
            chunkedLoading={true}
            maxClusterRadius={40}
            spiderfyOnMaxZoom={true}
            iconCreateFunction={crearIconoCluster}
          >
          {tiendas.map(tienda => {
            const lat = parseFloat(tienda.latitud);
            const lng = parseFloat(tienda.longitud);

            if (isNaN(lat) || isNaN(lng)) return null; 

            return (
              <Marker 
                key={tienda.id} 
                position={[lat, lng]} 
                icon={obtenerIcono(tienda)}
                ref={(m) => { marcadoresRef.current[tienda.id] = m; }}
                eventHandlers={{
                  click: () => {
                    if (onMarkerClick) onMarkerClick(tienda);
                  }
                }}
              />
            );
          })}
          </MarkerClusterGroup>
        )
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ), [tiendas, token, modoTermico])}
    </MapContainer>
  );
};

export default Mapa;