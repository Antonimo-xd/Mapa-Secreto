import { useEffect, useState } from 'react';
import axios from 'axios';
import Mapa from './components/Mapa';
import 'leaflet/dist/leaflet.css';

function App() {
  const [tiendas, setTiendas] = useState([]);

  useEffect(() => {
    // Llamada a tu API de Django
    axios.get('http://127.0.0.1:8000/api/tiendas/')
      .then(response => {
        setTiendas(response.data);
      })
      .catch(error => console.error("Error cargando tiendas:", error));
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <header>
        <h1>📍 Mapa Secreto: La Serena</h1>
        <p>Descubriendo el comercio local que no aparece en los mapas oficiales.</p>
      </header>

      <main>
        {/* Pasamos la lista de tiendas al componente Mapa */}
        <Mapa tiendas={tiendas} />
      </main>

      <section style={{ marginTop: '20px' }}>
        <h3>Tiendas registradas: {tiendas.length}</h3>
      </section>
    </div>
  );
}

export default App;