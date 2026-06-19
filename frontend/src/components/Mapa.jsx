import { useEffect, useRef, useState } from 'react';
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

// 4. Detector de Movimiento
function DetectorMovimiento({ setCentro }) {
  useMapEvents({
    moveend: (e) => {
      setCentro(e.target.getCenter());
    },
  });
  return null;
}

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

// === COMPONENTE PRINCIPAL ===
const Mapa = ({ tiendas, categorias, setCentro, token, onTiendaEliminada, setCoordsSeleccionadas, coordsSeleccionadas, onEditar, setMiUbicacion, tiendaEnfocada, rutaActual, rutas, onRutaEliminada, isDrawing, setRutaActual, mostrarRutas, onCambiarEstadoRuta}) => {
  const posicionLaSerena = [-29.9027, -71.2520];
  const marcadoresRef = useRef({});

  useEffect(() => {
    if (tiendaEnfocada && marcadoresRef.current[tiendaEnfocada.id]) {
      marcadoresRef.current[tiendaEnfocada.id].openPopup();
    }
  }, [tiendaEnfocada]);

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

  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta tienda?")) {
      try {
        await axios.delete(`${API_URL}/api/tiendas/${id}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        onTiendaEliminada(); 
      } catch (error) {
        alert("Error al eliminar tienda");
      }
    }
  };

  return (
    <MapContainer center={posicionLaSerena} zoom={18} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      <TileLayer maxZoom={20} url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      
      <Localizador setMiUbicacion={setMiUbicacion} />
      <ControladorMapa tiendas={tiendas} />
      <SelectorUbicacion setCoordsSeleccionadas={setCoordsSeleccionadas} token={token} />
      <DetectorMovimiento setCentro={setCentro} />
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

      <MarkerClusterGroup 
        chunkedLoading={true} // Mejora el rendimiento si hay cientos de tiendas
        maxClusterRadius={40} // Aumentamos un poquito el radio para que agrupe mejo
        spiderfyOnMaxZoom={true} // Activa el efecto "telaraña" si comparten coordenada exacta
        iconCreateFunction={crearIconoCluster}
      >

      {/* Tiendas Existentes */}
      {tiendas.map(tienda => {
        const lat = parseFloat(tienda.latitud);
        const lng = parseFloat(tienda.longitud);

        // 2. Validación
        if (isNaN(lat) || isNaN(lng)) return null; 

        // 3. Renderizado
        return (
          <Marker 
            key={tienda.id} 
            position={[lat, lng]} 
            icon={obtenerIcono(tienda)}
            ref={(m) => { marcadoresRef.current[tienda.id] = m; }}
          >
            <Popup className="enriched-popup">
              <div className="w-64 font-sans p-1">
                
                {/* 1. IMAGEN DE LA TIENDA */}
                {tienda.url_imagen && (
                  <img 
                    src={tienda.imagen ? tienda.imagen : tienda.url_imagen}
                    alt={tienda.nombre} 
                    className="w-full h-32 object-cover rounded-xl mb-3 shadow-sm border border-gray-100"
                    onError={(e) => e.target.style.display = 'none'} // Oculta si el link está roto
                  />
                )}

                {/* 2. ENCABEZADO (Nombre y Precio) */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-lg text-gray-800 leading-tight">
                    {tienda.nombre}
                  </h3>
                  <span className="text-green-600 font-black text-sm shrink-0 bg-green-50 px-2 rounded-full">
                    {'$'.repeat(tienda.rango_precios || 1)}
                  </span>
                </div>

                {/* 3. CATEGORÍAS (Etiquetas de colores) */}
                {tienda.categorias_detalle && tienda.categorias_detalle.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tienda.categorias_detalle.map(cat => (
                      <span 
                        key={cat.id} 
                        className="text-[10px] px-2 py-0.5 rounded-full text-white font-bold shadow-sm"
                        style={{ backgroundColor: cat.color_hex }}
                      >
                        {cat.nombre}
                      </span>
                    ))}
                  </div>
                )}

                {/* 4. DIRECCIÓN Y HORARIO */}
                <div className="text-xs text-gray-600 mb-3 space-y-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  {tienda.direccion && (
                    <p className="flex items-start gap-1">
                      <span className="shrink-0">📍</span> 
                      <span>{tienda.direccion}</span>
                    </p>
                  )}
                  {tienda.horarios?.general && (
                    <p className="flex items-start gap-1">
                      <span className="shrink-0">🕒</span> 
                      <span>{tienda.horarios.general}</span>
                    </p>
                  )}
                </div>

                {/* 5. DESCRIPCIÓN */}
                {tienda.descripcion && (
                  <p className="text-xs text-gray-500 italic mb-3 border-l-2 border-blue-200 pl-2">
                    "{tienda.descripcion}"
                  </p>
                )}

                {/* 6. CONTACTO (Botones de Redes Sociales) */}
                {(tienda.contacto?.ig || tienda.contacto?.whatsapp || tienda.contacto?.web) && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {tienda.contacto.ig && (
                      <a 
                        href={`https://instagram.com/${tienda.contacto.ig.replace('@', '')}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex-1 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white text-[11px] py-2 rounded-lg font-bold text-center shadow hover:scale-105 transition-transform"
                      >
                        📸 Instagram
                      </a>
                    )}
                    {tienda.contacto.whatsapp && (
                      <a 
                        href={`https://wa.me/${tienda.contacto.whatsapp.replace('+', '')}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex-1 bg-green-500 text-white text-[11px] py-2 rounded-lg font-bold text-center shadow hover:scale-105 transition-transform"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                    {tienda.contacto?.web && (
                      <a 
                        href={tienda.contacto.web.startsWith('http') ? tienda.contacto.web : `https://${tienda.contacto.web}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex-1 min-w-[30%] bg-blue-500 text-white text-[11px] py-2 rounded-lg font-bold text-center shadow hover:scale-105 transition-transform"
                      >
                        🌐 Web
                      </a>
                    )}
                  </div>
                )}

                {/* 7. BOTONES DE ADMINISTRADOR (Ocultos para usuarios normales) */}
                {token && (
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <button 
                        onClick={() => onEditar(tienda)} 
                        className="flex-1 bg-orange-50 text-orange-600 border border-orange-200 text-xs font-bold py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        onClick={() => handleEliminar(tienda.id)}
                        className="flex-1 bg-red-50 text-red-600 border border-red-200 text-xs font-bold py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        🗑️ Borrar
                      </button>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

export default Mapa;