import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Petición al endpoint que acabamos de configurar en Django
      const response = await axios.post(`${API_URL}/api/token/`, {
        username,
        password
      });

      // Si es exitoso, guardamos el token y cerramos
      const token = response.data.access;
      localStorage.setItem('access_token', token); // Guardar en el navegador
      onLoginSuccess(token);
      onClose();
      
    } catch (err) {
      console.error(err);
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-blue-600 p-4 text-center">
          <h2 className="text-white font-bold text-lg">Modo Administrador</h2>
          <p className="text-blue-100 text-sm">Ingresa para gestionar Mapa Secreto</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 text-xs rounded border border-red-200">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Usuario</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: admin"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••"
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-bold shadow-lg"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;