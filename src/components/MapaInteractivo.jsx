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

const crearIcono = (color) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34">
      <path fill="${color}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="3" fill="#ffffff"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-pin',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
  });
};

const pinRojo = crearIcono('#ef4444');
const pinNaranja = crearIcono('#f59e0b');
const pinAzul = crearIcono('#2563eb');

function EventosMapa({ onSeleccionarCoordenada }) {
  useMapEvents({
    click(e) {
      if (onSeleccionarCoordenada) {
        onSeleccionarCoordenada({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

function Centrador({ centro }) {
  const map = useMap();
  useEffect(() => {
    if (centro && Array.isArray(centro) && centro.length === 2) {
      map.flyTo(centro, 15, { duration: 1.2 });
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
      alert('¡Alerta resuelta! El pin fue retirado del mapa.');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const reportesVisibles = reportes.filter((r) => !r.resuelto);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer center={centro} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Centrador centro={centro} />
        <EventosMapa onSeleccionarCoordenada={onSeleccionarCoordenada} />

        {/* Pin que marca dónde tocaste */}
        {coordenadaSeleccionada && (
          <Marker position={[coordenadaSeleccionada.lat, coordenadaSeleccionada.lng]} icon={pinAzul}>
            <Popup autoPan={false}>
              <div style={{ textAlign: 'center' }}>
                <strong style={{ color: '#2563eb' }}>Punto Marcado</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Pines vigentes */}
        {reportesVisibles.map((item) => {
          // Extracción robusta de coordenadas (tanto de la vista como del WKT o GeoJSON)
          let lat = item.lat;
          let lng = item.lng;

          if (!lat || !lng) {
            if (item.ubicacion?.coordinates) {
              lat = item.ubicacion.coordinates[1];
              lng = item.ubicacion.coordinates[0];
            }
          }

          if (!lat || !lng) return null;

          const esPerdido = String(item.tipo_alerta).toUpperCase() === 'PERDIDO';
          const icono = esPerdido ? pinRojo : pinNaranja;

          return (
            <Marker key={item.id} position={[Number(lat), Number(lng)]} icon={icono}>
              <Popup>
                <div style={{ minWidth: '170px' }}>
                  <span
                    style={{
                      backgroundColor: esPerdido ? '#ef4444' : '#f59e0b',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      display: 'inline-block'
                    }}
                  >
                    {esPerdido ? 'PERDIDO' : 'AVISTADO'}
                  </span>

                  <p style={{ margin: '8px 0', fontSize: '0.85rem', color: '#1f2937' }}>
                    {item.descripcion || 'Sin descripción'}
                  </p>

                  {item.foto_url && (
                    <img
                      src={item.foto_url}
                      alt="Foto mascota"
                      style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }}
                    />
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {item.telefono_contacto && (
                      <a
                        href={`https://wa.me/${String(item.telefono_contacto).replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          backgroundColor: '#22c55e',
                          color: '#ffffff',
                          textAlign: 'center',
                          padding: '6px',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}
                      >
                        Contactar WhatsApp
                      </a>
                    )}

                    <button
                      onClick={() => marcarComoResuelto(item.id)}
                      style={{
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        padding: '6px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: '#374151'
                      }}
                    >
                      ✓ Marcar como Resuelto
                    </button>
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