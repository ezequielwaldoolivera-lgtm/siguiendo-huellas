import React, { useState, useEffect } from 'react';
import MapaInteractivo from './components/MapaInteractivo';
import FormularioAlerta from './components/FormularioAlerta';
import { supabase } from './services/supabase';
import { Navigation } from 'lucide-react';

export default function App() {
  const [reportes, setReportes] = useState([]);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);

  const cargarReportes = async () => {
    // 1. Fechas límite hacia atrás
    const ahora = new Date();
    const hace48Horas = new Date(ahora.getTime() - 48 * 60 * 60 * 1000);
    const hace15Dias = new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000);
    const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 2. Consulta a Supabase: activos de los últimos 30 días
    const { data, error } = await supabase
      .from('reportes_mapa')
      .select('*')
      .eq('activo', true)
      .gte('created_at', hace30Dias.toISOString());

    if (!error && data) {
      // 3. Filtrado dinámico por categoría según el TTL (Time To Live)
      const reportesVigentes = data.filter((item) => {
        const fechaReporte = new Date(item.created_at);

        // Perro Visto: solo si tiene menos de 48 horas
        if (item.tipo_alerta === 'avistado') {
          return fechaReporte >= hace48Horas;
        }

        // Perro Retenido / En Tránsito: máximo 15 días
        if (item.tipo_alerta === 'encontrado') {
          return fechaReporte >= hace15Dias;
        }

        // Perro Perdido: máximo 30 días
        return fechaReporte >= hace30Dias;
      });

      setReportes(reportesVigentes);
    }
  };

  const geolocalizar = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPuntoSeleccionado({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => alert('No se pudo acceder al GPS. Habilitá los permisos de ubicación.'),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ padding: '12px 16px', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.1rem' }}>Siguiendo Huellas</h1>
          <small style={{ color: '#94a3b8' }}>SIG Dinámico de Mascotas - Tres de Febrero</small>
        </div>
        <button 
          onClick={geolocalizar} 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
        >
          <Navigation size={14} /> Mi GPS
        </button>
      </header>

      <div style={{ flex: 1, position: 'relative' }}>
        <MapaInteractivo 
          reportes={reportes} 
  puntoSeleccionado={puntoSeleccionado} 
  onMarcar={setPuntoSeleccionado} 
  onActualizar={cargarReportes}
        />
      </div>

      <FormularioAlerta 
        puntoSeleccionado={puntoSeleccionado} 
        onReporteCreado={() => { 
          setPuntoSeleccionado(null); 
          cargarReportes(); 
        }} 
      />
    </div>
  );
}