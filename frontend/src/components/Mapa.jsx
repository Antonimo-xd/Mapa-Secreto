import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix para los iconos de Leaflet en React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const Mapa = ({ tiendas }) => {
  // Coordenadas aproximadas del centro de La Serena
  const posicionLaSerena = [-29.9027, -71.2520]; 

  return (
    <MapContainer 
      center={posicionLaSerena} 
      zoom={14} 
      style={{ height: '500px', width: '100%', borderRadius: '10px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {tiendas.map(tienda => (
        <Marker 
          key={tienda.id} 
          position={[parseFloat(tienda.latitud), parseFloat(tienda.longitud)]}
        >
          <Popup>
            <strong>{tienda.nombre}</strong> <br />
            {tienda.descripcion} <br />
            <small>Categoría: {tienda.categoria_nombre}</small>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Mapa;