import { useState, useEffect } from 'react';
import axios from 'axios';

// Recibimos la nueva prop: coordenadaInicial
const GuardarRutaModal = ({ isOpen, onClose, onGuardar, cantidadPuntos, coordenadaInicial }) => {
  const [datosNuevaRuta, setDatosNuevaRuta] = useState({ nombre: '', estado: 'verde' });

  // === MAGIA: GEOCODIFICACIÓN INVERSA ===
  // Este useEffect se dispara automáticamente apenas el modal se abre
  useEffect(() => {
    if (isOpen && coordenadaInicial) {
      const obtenerNombreCalle = async () => {
        try {
          // 1. Ponemos un texto temporal para que sepas que está buscando
          setDatosNuevaRuta(prev => ({ ...prev, nombre: 'Buscando nombre de la calle...' }));
          
          const [lat, lng] = coordenadaInicial;
          
          // 2. Le preguntamos a OpenStreetMap qué hay en esas coordenadas
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );

          // 3. Extraemos el nombre de la calle y la ciudad
          if (response.data && response.data.address) {
            const direccion = response.data.address;
            // A veces es 'road' (calle), a veces 'pedestrian' (paseo peatonal), etc.
            const calle = direccion.road || direccion.pedestrian || direccion.suburb || 'Calle Desconocida';
            const ciudad = direccion.city || direccion.town || direccion.village || '';
            
            // Armamos un nombre bonito, ej: "Avenida del Mar, La Serena"
            const nombreFinal = ciudad ? `${calle}, ${ciudad}` : calle;
            
            setDatosNuevaRuta(prev => ({ ...prev, nombre: nombreFinal }));
          } else {
            setDatosNuevaRuta(prev => ({ ...prev, nombre: 'Ruta Nueva' }));
          }
        } catch (error) {
          console.error("Error buscando la calle:", error);
          setDatosNuevaRuta(prev => ({ ...prev, nombre: '' })); // Si falla el internet, lo dejamos en blanco
        }
      };

      obtenerNombreCalle();
    } else if (!isOpen) {
      // Limpiamos los datos cuando el modal se cierra
      setDatosNuevaRuta({ nombre: '', estado: 'verde' });
    }
  }, [isOpen, coordenadaInicial]);

  if (!isOpen) return null;

  const handleClickGuardar = () => {
    if (!datosNuevaRuta.nombre) return alert("Por favor, ponle un nombre a la calle.");
    onGuardar(datosNuevaRuta); 
    setDatosNuevaRuta({ nombre: '', estado: 'verde' });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[4000] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <h2 className="text-xl font-black text-slate-800 mb-1">📍 Guardar Recorrido</h2>
        <p className="text-xs text-slate-500 mb-5">Se capturaron {cantidadPuntos} puntos GPS.</p>
        
        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Nombre de la calle o sector</label>
        <input 
          type="text" 
          className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
          placeholder="Ej: Avenida del Mar - Cuadra 1"
          value={datosNuevaRuta.nombre}
          onChange={e => setDatosNuevaRuta({...datosNuevaRuta, nombre: e.target.value})}
        />

        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Estado de exploración</label>
        <select 
          className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl mb-6 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={datosNuevaRuta.estado}
          onChange={e => setDatosNuevaRuta({...datosNuevaRuta, estado: e.target.value})}
        >
          <option value="verde">🟢 Completado (Anoté todas las tiendas)</option>
          <option value="amarillo">🟡 Incompleto (Me faltó tiempo/Batería)</option>
        </select>

        <div className="flex justify-end gap-3">
          <button 
            onClick={() => { onClose(); setDatosNuevaRuta({ nombre: '', estado: 'verde' }); }} 
            className="px-4 py-2 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors">
            Descartar Ruta
          </button>
          <button 
            onClick={handleClickGuardar} 
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md transition-all">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuardarRutaModal;