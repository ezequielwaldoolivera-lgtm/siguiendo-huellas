import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../services/supabase';

// Corrección de íconos base de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Función para generar pines SVG de diferentes colores según la categoría
const crearIconoMarcador = (colorHex) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34">
      <path fill="${colorHex}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="3" fill="#ffffff"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-pin-svg',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
  });
};

// Íconos por categoría
const iconoPerdido = crearIconoMarcador('#ef4444');   // Rojo
const iconoAvistado = crearIconoMarcador('#f59e0b');  // Ámbar / Naranja
const iconoSeleccion = crearIconoMarcador('#2563eb'); // Azul GPS / Selección

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

// Controlador de cámara para centrar el mapa
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
  // Marcar como resuelto en la tabla física y refrescar
  const marcarComoResuelto = async (id) => {
    try {
      const { error } = await supabase
        .from('reportes_mapa')
        .update({ resuelto: true })
        .eq('id', id);

      if (error) throw error;
      if (onAlertaModificada) {
        onAlertaModificada();
      }
      alert('¡Alerta resuelta! El pin fue retirado del mapa.');
    } catch (err) {
      console.error(err);
      alert('Error al resolver alerta: ' + err.message);
    }
  };

  // Solo mostramos en el mapa los que NO estén resueltos
  const reportesVigentes = reportes.filter((item) => !item.resuelto);

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

        {/* Pin temporal de selección con GPS o Clic (Azul) */}
        {coordenadaSeleccionada && (
          <Marker
            position={[coordenadaSeleccionada.lat, coordenadaSeleccionada.lng]}
            icon={iconoSeleccion}
          >
            <Popup autoPan={false}>
              <div style={{ textAlign: 'center', padding: '2px' }}>
                <strong style={{ color: '#2563eb' }}>Punto Seleccionado</strong>
                <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                  {coordenadaSeleccionada.lat.toFixed(5)}, {coordenadaSeleccionada.lng.toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Pines vigentes en el mapa con color temático */}
        {reportesVigentes.map((item) => {
          const lat = item.lat || (item.ubicacion?.coordinates ? item.ubicacion.coordinates[1] : null);
          const lng = item.lng || (item.ubicacion?.coordinates ? item.ubicacion.coordinates[0] : null);

          if (!lat || !lng) return null;

          const esPerdido = String(item.tipo_alerta).toUpperCase() === 'PERDIDO';
          const iconoElegido = esPerdido ? iconoPerdido : iconoAvistado;

          return (
            <Marker key={item.id} position={[lat, lng]} icon={iconoElegido}>
              <Popup>
                <div style={{ minWidth: '180px' }}>
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

                  <h4 style={{ margin: '8px 0 4px 0', fontSize: '0.95rem', color: '#111827' }}>
                    {item.descripcion ? (item.descripcion.length > 30 ? item.descripcion.substring(0, 30) + '...' : item.descripcion) : 'Reporte de mascota'}
                  </h4>

                  {item.descripcion && (
                    <p style={{ margin: '4px 0', fontSize: '0.8rem', color: '#4b5563' }}>
                      {item.descripcion}
                    </p>
                  )}

                  {item.foto_url && (
                    <img
                      src={item.foto_url}
                      alt="Foto mascota"
                      style={{
                        width: '100%',
                        height: '110px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        marginTop: '6px'
                      }}
                    />
                  )}

                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                        Contactar por WhatsApp
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
                      ✓ Marcar como Resuelto / Retirado
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