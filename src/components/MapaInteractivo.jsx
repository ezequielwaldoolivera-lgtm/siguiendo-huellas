import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../services/supabase';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Listener para capturar clics en el mapa
function ManejadorEventosMapa({ onSeleccionarCoordenada }) {
  useMapEvents({
    click(e) {
      if (onSeleccionarCoordenada) {
        onSeleccionarCoordenada({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

// Controlador de cámara para centrar el mapa al usar GPS o tocar el panel
function CentradorMapa({ centro }) {
  const map = useMap();
  useEffect(() => {
    if (centro && Array.isArray(centro) && centro.length === 2) {
      map.flyTo(centro, 15, { animate: true, duration: 1.2 });
    }
  }, [centro, map]);
  return null;
}

export default function MapaInteractivo({
  reportes = [],
  centro = [-34.6037, -58.5600],
  coordenadaSeleccionada = null,
  onSeleccionarCoordenada,
  onAlertaModificada
}) {
  const marcarComoResuelto = async (id) => {
    try {
      const { error } = await supabase
        .from('reportes_mapa')
        .update({ resuelto: true })
        .eq('id', id);

      if (error) throw error;
      if (onAlertaModificada) onAlertaModificada();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={centro}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <CentradorMapa centro={centro} />
        <ManejadorEventosMapa onSeleccionarCoordenada={onSeleccionarCoordenada} />

        {/* Pin temporal que marca dónde se hizo clic */}
        {coordenadaSeleccionada && (
          <Marker position={[coordenadaSeleccionada.lat, coordenadaSeleccionada.lng]}>
            <Popup autoPan={false}>
              <div style={{ textAlign: 'center', padding: '2px' }}>
                <strong style={{ color: '#2563eb' }}>Punto Marcado</strong>
                <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                  {coordenadaSeleccionada.lat.toFixed(5)}, {coordenadaSeleccionada.lng.toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcadores de los reportes guardados */}
        {reportes.map((item) => {
          if (!item.ubicacion || !item.ubicacion.coordinates) return null;
          const [lng, lat] = item.ubicacion.coordinates;

          return (
            <Marker key={item.id} position={[lat, lng]}>
              <Popup>
                <div style={{ minWidth: '170px' }}>
                  <span
                    style={{
                      backgroundColor: item.tipo_alerta === 'PERDIDO' ? '#ef4444' : '#f59e0b',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 700
                    }}
                  >
                    {item.tipo_alerta}
                  </span>

                  <h4 style={{ margin: '6px 0 2px 0', fontSize: '0.95rem' }}>
                    {item.nombre_contacto || 'Alerta Comunitaria'}
                  </h4>

                  {item.descripcion && (
                    <p style={{ margin: '4px 0', fontSize: '0.8rem', color: '#374151' }}>
                      {item.descripcion}
                    </p>
                  )}

                  {item.foto_url && (
                    <img
                      src={item.foto_url}
                      alt="Foto"
                      style={{
                        width: '100%',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        marginTop: '4px'
                      }}
                    />
                  )}

                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {item.telefono_contacto && (
                      <a
                        href={`https://wa.me/${item.telefono_contacto.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          backgroundColor: '#22c55e',
                          color: '#fff',
                          textAlign: 'center',
                          padding: '5px',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        WhatsApp
                      </a>
                    )}

                    {!item.resuelto && (
                      <button
                        onClick={() => marcarComoResuelto(item.id)}
                        style={{
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          padding: '4px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Marcar Resuelto
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}