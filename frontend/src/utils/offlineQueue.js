import localforage from 'localforage';
import axios from 'axios';

// 1. Configurar la base de datos local
const offlineStorage = localforage.createInstance({
  name: 'MapaSecretoDB',
  storeName: 'offline_queue'
});

// Función auxiliar para convertir FormData a Objeto (porque IndexedDB no puede guardar FormData)
const formDataToObject = (formData) => {
  const obj = {};
  for (let [key, value] of formData.entries()) {
    if (obj[key]) {
      if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
      obj[key].push(value);
    } else {
      obj[key] = value;
    }
  }
  return obj;
};

// Función auxiliar para revertir el Objeto a FormData
const objectToFormData = (obj) => {
  const fd = new FormData();
  Object.keys(obj).forEach(key => {
    if (Array.isArray(obj[key])) {
      obj[key].forEach(val => fd.append(key, val));
    } else {
      fd.append(key, obj[key]);
    }
  });
  return fd;
};

export const agregarAColaOffline = async (url, metodo, datos, headers, esFormData = false) => {
  try {
    const tareaId = Date.now().toString();
    
    // Si es FormData, lo convertimos a objeto crudo (JSON + Blobs)
    const datosASerializar = esFormData ? formDataToObject(datos) : datos;

    const tarea = {
      id: tareaId,
      url,
      metodo,
      datos: datosASerializar,
      headers,
      esFormData,
      fecha: Date.now()
    };

    await offlineStorage.setItem(tareaId, tarea);
    console.log(`📡 Tarea offline guardada en bóveda (ID: ${tareaId})`);
    return tarea;
  } catch (error) {
    console.error("Error al guardar en bóveda offline:", error);
  }
};

export const sincronizarColaOffline = async (token) => {
  if (!navigator.onLine) {
    console.log("No hay internet, sincronización abortada.");
    return false;
  }

  try {
    const keys = await offlineStorage.keys();
    if (keys.length === 0) {
      console.log("✅ Bóveda vacía, todo sincronizado.");
      return false;
    }

    console.log(`🔄 Sincronizando ${keys.length} tareas pendientes...`);
    let tareasSincronizadas = 0;

    for (const key of keys) {
      const tarea = await offlineStorage.getItem(key);
      if (!tarea) continue;

      try {
        // Reconstruimos los datos
        const payload = tarea.esFormData ? objectToFormData(tarea.datos) : tarea.datos;
        
        // Actualizamos el token en caso de que haya cambiado mientras estaba offline
        const headersActivos = { ...tarea.headers };
        if (token && headersActivos['Authorization']) {
          headersActivos['Authorization'] = `Bearer ${token}`;
        }

        const config = { headers: headersActivos };

        if (tarea.metodo === 'POST') {
          await axios.post(tarea.url, payload, config);
        } else if (tarea.metodo === 'PUT') {
          await axios.put(tarea.url, payload, config);
        } else if (tarea.metodo === 'PATCH') {
          await axios.patch(tarea.url, payload, config);
        } else if (tarea.metodo === 'DELETE') {
          await axios.delete(tarea.url, config);
        }

        // Si tuvo éxito, la borramos de la bóveda
        await offlineStorage.removeItem(key);
        tareasSincronizadas++;
        console.log(`✅ Tarea ${key} sincronizada con éxito.`);
      } catch (err) {
        console.error(`❌ Error al sincronizar tarea ${key}. Se intentará más tarde.`, err);
        // Si el error es 400 o 403, podríamos querer eliminarla para que no bloquee,
        // pero por ahora la dejaremos en la bóveda por si fue un problema temporal.
      }
    }

    return tareasSincronizadas > 0;
  } catch (error) {
    console.error("Error al acceder a la bóveda de sincronización:", error);
    return false;
  }
};

export const obtenerCantidadTareasPendientes = async () => {
  try {
    const keys = await offlineStorage.keys();
    return keys.length;
  } catch {
    return 0;
  }
};
