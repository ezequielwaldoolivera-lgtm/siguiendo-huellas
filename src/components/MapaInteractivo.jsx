import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Phone, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

// Función para generar pines con colores dinámicos SVG
const crearIcono = (color) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `<svg width="30" height="42" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 36 12 36C12 36 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="${color}"/>
            <circle cx="12" cy="12" r="5" fill="white"/>
           </svg>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -38],
  });
};
// Función para calcular el tiempo restante antes de que caduque el pin
const calcularTiempoRestante = (createdAt, tipoAlerta) => {
  const horasTotales = tipoAlerta === 'avistado' ? 48 : tipoAlerta === 'encontrado' ? 360 : 720; // 48h, 15d o 30d
  const creado = new Date(createdAt).getTime();
  const expira = creado + horasTotales * 60 * 60 * 1000;
  const diferenciaMs = expira - Date.now();

  if (diferenciaMs <= 0) return 'Expirado';

  const horas = Math.floor(diferenciaMs / (1000 * 60 * 60));
  const dias = Math.floor(horas / 24);

  if (dias > 0) {
    return `Quedan ${dias} día${dias > 1 ? 's' : ''}`;
  }
  return `Quedan ${horas} hora${horas > 1 ? 's' : ''}`;
};
const iconoRojo = crearIcono('#dc2626');   // Perdido
const iconoNaranja = crearIcono('#f59e0b'); // Visto
const iconoVerde = crearIcono('#16a34a');   // Retenido
const iconoTemporal = crearIcono('#2563eb'); // Selección actual

function EventosMapa({ onMarcar }) {
  useMapEvents({
    click(e) {
      onMarcar(e.latlng);
    },
  });
  return null;
}

function CentradorAutomatico({ centro }) {
  const map = useMap();
  React.useEffect(() => {
    if (centro) map.flyTo(centro, 16);
  }, [centro, map]);
  return null;
}

export default function MapaInteractivo({ reportes, puntoSeleccionado, onMarcar, onActualizar }) {
  const centro3F = [-34.5986, -58.5911];

  const resolverAlerta = async (id) => {
    if (confirm('¿Confirmás que la mascota ya fue encontrada/resuelta? Se quitará del mapa.')) {
      const { error } = await supabase.from('reportes_mapa').update({ activo: false }).eq('id', id);
      
      if (error) {
        alert(`Error al dar de baja: ${error.message}`);
      } else {
        alert('¡Alerta resuelta con éxito!');
        if (onActualizar) {
          onActualizar();
        }
      }
    }
  };

  return (
    <MapContainer center={centro3F} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <EventosMapa onMarcar={onMarcar} />
      {puntoSeleccionado && <CentradorAutomatico centro={[puntoSeleccionado.lat, puntoSeleccionado.lng]} />}

      {reportes.map((item) => {
        let iconoSeleccionado = iconoRojo;
        if (item.tipo_alerta === 'avistado') iconoSeleccionado = iconoNaranja;
        if (item.tipo_alerta === 'encontrado') iconoSeleccionado = iconoVerde;

        return (
          <Marker key={item.id} position={[item.latitud, item.longitud]} icon={iconoSeleccionado}>
            <Popup>
              <div style={{ maxWidth: '210px' }}>
                {item.foto_url && (
                  <img 
                    src={item.foto_url} 
                    alt="Mascota" 
                    style={{ width: '100%', height: '115px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }} 
                  />
                )}
                <strong style={{ 
                  color: item.tipo_alerta === 'perdido' ? '#dc2626' : item.tipo_alerta === 'avistado' ? '#d97706' : '#16a34a', 
                  display: 'block', 
                  textTransform: 'uppercase' 
                }}>
                  {item.tipo_alerta}
                </strong>
                <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>{item.descripcion}</p>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', margin: '4px 0' }}>
  ⏳ {calcularTiempoRestante(item.created_at, item.tipo_alerta)}
</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                  {item.contacto_telefono && (
                    <a 
                      href={`https://wa.me/${item.contacto_telefono.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                    >
                      <Phone size={14} /> WhatsApp
                    </a>
                  )}

                  <button
                    onClick={() => resolverAlerta(item.id)}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}
                  >
                    <CheckCircle size={12} color="#16a34a" /> Marcar como Resuelto
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {puntoSeleccionado && (
        <Marker position={[puntoSeleccionado.lat, puntoSeleccionado.lng]} icon={iconoTemporal}>
          <Popup>Punto de alerta seleccionado</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}