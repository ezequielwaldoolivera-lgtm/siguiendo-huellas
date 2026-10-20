import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../services/supabase';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const crearIconoPin = (colorHex) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
    <path fill="${colorHex}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="3.2" fill="#ffffff"/>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: 'custom-pin-svg',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const pinRojo = crearIconoPin('#ef4444');      // Perdido
const pinNaranja = crearIconoPin('#f59e0b');   // Avistado
const pinAzul = crearIconoPin('#0284c7');      // Retenido
const pinVerde = crearIconoPin('#10b981');     // Selección GPS

function ListenerClicMapa({ onSeleccionarCoordenada }) {
  useMapEvents({
    click(e) {
      if (onSeleccionarCoordenada) {
        onSeleccionarCoordenada({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

function CamaraMapa({ centro }) {
  const map = useMap();
  useEffect(() => {
    if (centro && Array.isArray(centro) && centro.length === 2) {
      map.flyTo(centro, 14, { duration: 1.0 });
    }
  }, [centro, map]);
  return null;
}

export default function MapaInteractivo({
  reportes = [],
  centro = [-34.6037, -58.5600],
  coordenadaSeleccionada = null,
  onSeleccionarCoordenada,
  onAlertaModificada,
  onVincularAvistamiento
}) {
  const marcarComoResuelto = async (item) => {
    const pinGuardadoLocal = localStorage.getItem(`pin_alerta_${item.id}`);
    const pinIngresado = prompt('Ingresá el PIN de 4 dígitos creado para esta alerta:');

    if (!pinIngresado) return;

    if (item.pin_seguridad && item.pin_seguridad !== pinIngresado.trim() && pinGuardadoLocal !== pinIngresado.trim()) {
      alert('PIN incorrecto. Solo el autor original puede resolver esta alerta.');
      return;
    }

    try {
      const { error } = await supabase
        .from('reportes_mapa')
        .update({ resuelto: true })
        .eq('id', item.id);

      if (error) throw error;
      if (onAlertaModificada) onAlertaModificada();
      alert('¡Alerta resuelta con éxito!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const trayectorias = [];
  reportes.forEach((rep) => {
    if (rep.id_padre && !rep.resuelto) {
      const padre = reportes.find((p) => p.id === rep.id_padre && !p.resuelto);
      if (padre && padre.lat && padre.lng && rep.lat && rep.lng) {
        trayectorias.push({
          de: [padre.lat, padre.lng],
          a: [rep.lat, rep.lng],
          id: `${padre.id}-${rep.id}`
        });
      }
    }
  });

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer center={centro} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <CamaraMapa centro={centro} />
        <ListenerClicMapa onSeleccionarCoordenada={onSeleccionarCoordenada} />

        {/* Líneas de trayectoria de desplazamiento */}
        {trayectorias.map((linea) => (
          <Polyline
            key={linea.id}
            positions={[linea.de, linea.a]}
            pathOptions={{ color: '#f59e0b', weight: 3, dashArray: '6, 8', opacity: 0.8 }}
          />
        ))}

        {/* Marcador GPS temporal de selección */}
        {coordenadaSeleccionada && (
          <Marker position={[coordenadaSeleccionada.lat, coordenadaSeleccionada.lng]} icon={pinVerde}>
            <Popup autoPan={false}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#047857' }}>
                Punto marcado
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcadores de base de datos */}
        {reportes.map((item, index) => {
          if (item.resuelto) return null;

          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lng);

          if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;

          const tipo = String(item.tipo_alerta || '').toUpperCase();
          let icono = pinRojo;
          let colorBadge = '#ef4444';
          let textoBadge = 'PERDIDO';

          if (tipo === 'VISTO' || tipo === 'AVISTADO') {
            icono = pinNaranja;
            colorBadge = '#f59e0b';
            textoBadge = 'AVISTADO';
          } else if (tipo === 'RETENIDO') {
            icono = pinAzul;
            colorBadge = '#0284c7';
            textoBadge = 'RETENIDO';
          }

          return (
            <Marker key={item.id ? `rep-${item.id}` : `pin-${index}`} position={[lat, lng]} icon={icono}>
              <Popup>
                <div style={{ minWidth: '175px' }}>
                  <span
                    style={{
                      backgroundColor: colorBadge,
                      color: '#ffffff',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      display: 'inline-block'
                    }}
                  >
                    {textoBadge}
                  </span>

                  <p style={{ margin: '6px 0', fontSize: '0.82rem', color: '#1f2937' }}>
                    {item.descripcion || 'Sin descripción'}
                  </p>

                  {item.foto_url && (
                    <img
                      src={item.foto_url}
                      alt="Foto mascota"
                      style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '5px', marginBottom: '6px' }}
                    />
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {(item.telefono_contacto || item.contacto_telefono) && (
                      <a
                        href={`https://wa.me/${String(item.telefono_contacto || item.contacto_telefono).replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          backgroundColor: '#22c55e',
                          color: '#ffffff',
                          textAlign: 'center',
                          padding: '5px',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}
                      >
                        Contactar WhatsApp
                      </a>
                    )}

                    <button
                      onClick={() => onVincularAvistamiento(item.id)}
                      style={{
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fde68a',
                        color: '#92400e',
                        padding: '5px',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      📍 Lo vi por acá (Nuevo rastro)
                    </button>

                    <button
                      onClick={() => marcarComoResuelto(item)}
                      style={{
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        padding: '5px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: '#374151'
                      }}
                    >
                      🔒 Resolver (Pide PIN)
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