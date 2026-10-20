import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../services/supabase';

// Corrección de íconos predeterminados de Leaflet en Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Componente interno para capturar clics en el mapa
function SelectorUbicacion({ onSeleccionarCoordenada }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onSeleccionarCoordenada({ lat, lng });
    },
  });
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
      alert('Error al resolver alerta: ' + err.message);
    }
  };

  return (
    <MapContainer
      center={centro}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Capturador de eventos de clic */}
      <SelectorUbicacion onSeleccionarCoordenada={onSeleccionarCoordenada} />

      {/* Pin temporal que marca EXACTAMENTE dónde hiciste clic */}
      {coordenadaSeleccionada && (
        <Marker position={[coordenadaSeleccionada.lat, coordenadaSeleccionada.lng]}>
          <Popup autoPan={false}>
            <div style={{ textAlign: 'center', padding: '4px' }}>
              <strong style={{ color: '#2563eb' }}>Punto Seleccionado</strong>
              <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#4b5563' }}>
                Lat: {coordenadaSeleccionada.lat.toFixed(5)}<br />
                Lng: {coordenadaSeleccionada.lng.toFixed(5)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: '4px' }}>
                Completa el formulario inferior para guardar.
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Renderizado de reportes guardados */}
      {reportes.map((item) => {
        if (!item.ubicacion || !item.ubicacion.coordinates) return null;
        const [lng, lat] = item.ubicacion.coordinates;

        return (
          <Marker key={item.id} position={[lat, lng]}>
            <Popup>
              <div style={{ minWidth: '180px' }}>
                <span
                  style={{
                    backgroundColor: item.tipo_alerta === 'PERDIDO' ? '#ef4444' : '#f59e0b',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}
                >
                  {item.tipo_alerta}
                </span>

                <h4 style={{ margin: '8px 0 4px 0', fontSize: '1rem' }}>
                  {item.nombre_contacto || 'Alerta'}
                </h4>

                {item.descripcion && (
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#374151' }}>
                    {item.descripcion}
                  </p>
                )}

                {item.foto_url && (
                  <img
                    src={item.foto_url}
                    alt="Foto reporte"
                    style={{
                      width: '100%',
                      height: '110px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      marginTop: '6px'
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
                      Contactar por WhatsApp
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
                      Marcar como Resuelto
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}