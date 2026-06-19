import { useState, useEffect } from 'react';
import axios from 'axios';

const CrearCategoriaModal = ({ isOpen, onClose, token, onCategoriaCreada, categoriaAEditar }) => {
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(false);

  // Colores predefinidos "bonitos" para sugerir
  const paleta = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', 
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#64748B'
  ];

  // Función segura para cerrar
  const cerrarModal = () => {
    if (typeof onClose === 'function') {
      onClose();
    } else {
      console.error("⛔ ERROR: La función 'onClose' no se pasó correctamente desde App.jsx");
    }
  };

  // EFECTO: Detectar si editamos o creamos
  useEffect(() => {
      if (isOpen) {
        if (categoriaAEditar) {
          // MODO EDICIÓN: Cargar datos
          setNombre(categoriaAEditar.nombre);
          setColor(categoriaAEditar.color_hex);
        } else {
          // MODO CREACIÓN: Limpiar y color random
          setNombre('');
          setColor(paleta[Math.floor(Math.random() * paleta.length)]);
        }
      }
    }, [isOpen, categoriaAEditar]);

  if (!isOpen) return null;

  // FUNCIÓN PARA CREAR O ACTUALIZAR (POST / PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const datos = {
      nombre: nombre,
      color_hex: color,
      icono: 'star' 
    };

    try {
        if (categoriaAEditar) {
          await axios.put(`http://127.0.0.1:8000/api/categorias/${categoriaAEditar.id}/`, datos, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          alert("¡Categoría actualizada!");
        } else {
          await axios.post('http://127.0.0.1:8000/api/categorias/', datos, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          alert("¡Categoría creada!");
        }
        
        onCategoriaCreada();
        cerrarModal(); 
  } catch (error) {
        console.error(error);
        alert("Error al guardar. Revisa si el nombre ya existe.");
  } finally {
        setLoading(false);
      }
  };

  // --- NUEVA FUNCIÓN PARA ELIMINAR (DELETE) ---
  const handleEliminar = async () => {
    // 1. Pedimos confirmación al usuario por seguridad
    const confirmacion = window.confirm(
      `¿Estás seguro de eliminar la categoría "${categoriaAEditar.nombre}"?\n\nNota: Las tiendas que tengan esta categoría no se borrarán, solo dejarán de pertenecer a este grupo.`
    );

    if (confirmacion) {
      setLoading(true);
      try {
        await axios.delete(`http://127.0.0.1:8000/api/categorias/${categoriaAEditar.id}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        alert("Categoría eliminada.");
        onCategoriaCreada(); // Recarga la lista en el Sidebar
        cerrarModal();       // Cierra el modal
      } catch (error) {
        console.error(error);
        alert("Error al eliminar la categoría.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
        <div className={`p-4 ${categoriaAEditar ? 'bg-orange-500' : 'bg-gray-800'}`}>
          <h2 className="text-white font-bold text-lg">
            {categoriaAEditar ? '✏️ Editar Categoría' : 'Nueva Categoría'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nombre</label>
            <input 
              required
              autoFocus
              type="text" 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-800"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Color</label>
            <div className="flex gap-2 items-center mb-2">
              <input 
                type="color" 
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-none"
              />
              <span className="text-xs font-mono text-gray-500">{color}</span>
            
              <div className="flex flex-wrap gap-2 ml-2">
                {paleta.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex gap-3 pt-2">
            {categoriaAEditar && (
              <button 
                type="button" 
                onClick={handleEliminar}
                disabled={loading}
                className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center justify-center"
                title="Eliminar Categoría">
                🗑️
              </button>
            )}

            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">
                Cancelar
            </button>

            <button 
              type="submit" 
              disabled={loading || !nombre.trim()}
              className={`flex-1 py-3 text-white rounded-xl font-bold disabled:opacity-50 ${categoriaAEditar ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-800 hover:bg-black'}`}>
              {loading ? '...' : (categoriaAEditar ? 'Guardar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearCategoriaModal;