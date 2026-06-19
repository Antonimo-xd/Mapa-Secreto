import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const CrearTiendaModal = ({ isOpen, onClose, categorias, latitud, longitud, token, onTiendaCreada, tiendaAEditar }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    categorias: [],
    direccion: '',
    descripcion: '',
    rango_precios: 1,
    url_imagen: '',
    ig: '',
    wsp: '',
    horario: '',
    web: '',
    imagenArchivo: null
  });
  const [loading, setLoading] = useState(false);

  // === EFECTO DE CARGA Y GEOCODIFICACIÓN MÁGICA ===
  useEffect(() => {
    if (isOpen) {
      if (tiendaAEditar) {
        // MODO EDICIÓN: Cargamos los datos que ya existen en la base de datos
        setFormData({
          nombre: tiendaAEditar.nombre,
          categorias: tiendaAEditar.categorias || [], 
          direccion: tiendaAEditar.direccion || '',
          descripcion: tiendaAEditar.descripcion || '',
          rango_precios: tiendaAEditar.rango_precios || 1,
          url_imagen: tiendaAEditar.url_imagen || '',
          ig: tiendaAEditar.contacto?.ig || '',
          wsp: tiendaAEditar.contacto?.whatsapp || '',
          web: tiendaAEditar.contacto?.web || '',
          horario: tiendaAEditar.horarios?.general || '',
          imagenArchivo: null
        });
      } else {
        // MODO CREACIÓN: Limpiamos todo y ponemos el texto de carga en la dirección
        setFormData({ 
          nombre: '', categorias: [], direccion: 'Buscando dirección...', 
          descripcion: '', rango_precios: 1, url_imagen: '', 
          ig: '', wsp: '', horario: '', web: '', imagenArchivo: null 
        });

        // Le preguntamos a OpenStreetMap qué hay exactamente en este punto GPS
        if (latitud && longitud) {
          const obtenerDireccionTienda = async () => {
            try {
              const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitud}&lon=${longitud}`
              );

              if (response.data && response.data.address) {
                const d = response.data.address;
                // Buscamos la calle
                const calle = d.road || d.pedestrian || d.suburb || d.neighbourhood || '';
                // Buscamos el número de puerta (si existe en el mapa)
                const numero = d.house_number || '';
                // Buscamos la ciudad
                const ciudad = d.city || d.town || d.village || '';

                // Armamos la dirección completa (Ej: "Avenida Balmaceda 1234, La Serena")
                let direccionFinal = calle;
                if (numero) direccionFinal += ` ${numero}`;
                if (ciudad) direccionFinal += `, ${ciudad}`;

                // Actualizamos solo el campo de dirección en el formulario sin borrar el resto
                setFormData(prev => ({ 
                  ...prev, 
                  direccion: direccionFinal.trim() || 'Dirección desconocida' 
                }));
              } else {
                setFormData(prev => ({ ...prev, direccion: '' }));
              }
            } catch (error) {
              console.error("Error obteniendo dirección de la tienda:", error);
              setFormData(prev => ({ ...prev, direccion: '' })); // Si no hay internet, lo dejamos en blanco
            }
          };

          obtenerDireccionTienda();
        }
      }
    }
  }, [isOpen, tiendaAEditar, latitud, longitud]);

  if (!isOpen) return null;

  const toggleCategoria = (id) => {
    setFormData(prev => {
      const existe = prev.categorias.includes(id);
      if (existe) {
        return { ...prev, categorias: prev.categorias.filter(c => c !== id) };
      } else {
        return { ...prev, categorias: [...prev.categorias, id] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Creamos un "sobre" especial para poder meter archivos
    const dataToSend = new FormData();
    dataToSend.append('nombre', formData.nombre);
    dataToSend.append('direccion', formData.direccion);
    dataToSend.append('descripcion', formData.descripcion);
    dataToSend.append('rango_precios', formData.rango_precios);
    dataToSend.append('url_imagen', formData.url_imagen);
    dataToSend.append('latitud', tiendaAEditar ? tiendaAEditar.latitud : latitud);
    dataToSend.append('longitud', tiendaAEditar ? tiendaAEditar.longitud : longitud);

    // Añadimos las categorías una por una
    formData.categorias.forEach(cat => dataToSend.append('categorias', cat));

    // Empaquetamos el contacto (¡Ahora con Web!) y horario como texto JSON
    dataToSend.append('contacto', JSON.stringify({ ig: formData.ig, whatsapp: formData.wsp, web: formData.web }));
    dataToSend.append('horarios', JSON.stringify({ general: formData.horario }));

    // Si el usuario seleccionó un archivo de foto, lo metemos al sobre
    if (formData.imagenArchivo) {
      dataToSend.append('imagen', formData.imagenArchivo);
    }

    // Configuración especial para enviar archivos
    const config = { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };

    try {
      if (tiendaAEditar) {
      await axios.put(`${API_URL}/api/tiendas/${tiendaAEditar.id}/`, dataToSend, config);
      alert("¡Tienda actualizada!");
    } else {
      await axios.post(`${API_URL}/api/tiendas/`, dataToSend, config);
      alert("¡Tienda creada!");
      }
      onTiendaCreada(); 
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al guardar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] p-4 backdrop-blur-sm">
      {/* 1. MODAL MÁS ANCHO (max-w-3xl) */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className={`p-4 shrink-0 ${tiendaAEditar ? 'bg-orange-500' : 'bg-gradient-to-r from-blue-600 to-indigo-700'}`}>
          <h2 className="text-white font-bold text-lg">
            {tiendaAEditar ? '✏️ Editar Tienda' : '📍 Nueva Tienda Secreta'}
          </h2>
          <p className="text-white/80 text-xs">
            {tiendaAEditar ? 'Modificando información existente' : `Ubicación GPS: ${latitud?.toFixed(5)}, ${longitud?.toFixed(5)}`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          {/* CUERPO DEL MODAL (CON SCROLL Y 2 COLUMNAS) */}
          <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">
            
            {/* --- COLUMNA IZQUIERDA: Información Principal --- */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nombre del lugar *</label>
                <input required type="text" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Categorías *</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {categorias.map(cat => {
                    const isSelected = formData.categorias.includes(cat.id);
                    return (
                      <button key={cat.id} type="button" onClick={() => toggleCategoria(cat.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${isSelected ? 'text-white shadow-md scale-105' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                        style={{ backgroundColor: isSelected ? cat.color_hex : 'white', borderColor: isSelected ? cat.color_hex : '' }}>
                        {cat.nombre} {isSelected && '✓'}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Precios (Aprox)</label>
                <div className="flex justify-between bg-gray-50 p-1 rounded-lg border border-gray-200">
                  {[1, 2, 3, 4].map(num => (
                    <button key={num} type="button" onClick={() => setFormData({...formData, rango_precios: num})}
                      className={`flex-1 mx-0.5 py-1.5 rounded font-bold text-sm transition-colors ${formData.rango_precios >= num ? 'bg-green-500 text-white shadow-sm' : 'bg-transparent text-gray-400 hover:bg-gray-200'}`}>
                      {'$'.repeat(num)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Descripción corta</label>
                <textarea rows="4" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none text-sm focus:border-blue-500 focus:bg-white transition-colors"
                  value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
              </div>
            </div>

            {/* --- COLUMNA DERECHA: Ubicación, Contacto y Fotos --- */}
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Dirección / Referencia</label>
                  <input type="text" placeholder="Ej: Calle 123, esquina..." className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm"
                    value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Horarios</label>
                  <input type="text" placeholder="Ej: Lun a Vie - 10:00 a 18:00" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm"
                    value={formData.horario} onChange={e => setFormData({...formData, horario: e.target.value})} />
                </div>
              </div>

              {/* Redes y Web en un solo bloque visual */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase">Contacto y Redes</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input type="text" placeholder="📱 WhatsApp" className="w-full p-2 border border-green-200 rounded-lg text-xs outline-none focus:border-green-500"
                      value={formData.wsp} onChange={e => setFormData({...formData, wsp: e.target.value})} />
                  </div>
                  <div>
                    <input type="text" placeholder="📸 Instagram" className="w-full p-2 border border-pink-200 rounded-lg text-xs outline-none focus:border-pink-500"
                      value={formData.ig} onChange={e => setFormData({...formData, ig: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <input type="text" placeholder="🌐 Sitio Web (URL)" className="w-full p-2 border border-blue-200 rounded-lg text-xs outline-none focus:border-blue-500"
                      value={formData.web} onChange={e => setFormData({...formData, web: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Sección Fotos más limpia */}
              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-3">
                <label className="block text-[10px] font-black text-indigo-800 uppercase">Imágenes del Lugar</label>
                
                <div>
                  <label className="block text-[10px] font-bold text-indigo-600 mb-1">Subir archivo (Recomendado)</label>
                  <input 
                    type="file" accept="image/*" 
                    className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer bg-white border border-indigo-100 rounded-lg"
                    onChange={e => setFormData({...formData, imagenArchivo: e.target.files[0]})} 
                  />
                </div>

                <div className="flex items-center gap-2 py-1">
                  <hr className="flex-1 border-indigo-100" />
                  <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">O USA UN LINK</span>
                  <hr className="flex-1 border-indigo-100" />
                </div>

                <div>
                  <input type="url" placeholder="https://ejemplo.com/foto.jpg" className="w-full p-2 bg-white border border-indigo-100 rounded-lg text-xs outline-none focus:border-indigo-400"
                    value={formData.url_imagen} onChange={e => setFormData({...formData, url_imagen: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER: Botones fijos abajo */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3 shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors shadow-sm">
              Cancelar
            </button>
            <button type="submit" disabled={loading || formData.categorias.length === 0}
              className={`flex-1 py-3 text-white rounded-xl font-bold shadow-md disabled:opacity-50 transition-all ${tiendaAEditar ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {loading ? 'Guardando...' : (tiendaAEditar ? '💾 Actualizar Tienda' : '📍 Registrar Tienda')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CrearTiendaModal;