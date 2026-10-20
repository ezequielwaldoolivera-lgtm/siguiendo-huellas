import React, { useState, useEffect } from 'react';
import MapaInteractivo from './components/MapaInteractivo';
import FormularioAlerta from './components/FormularioAlerta';
import { supabase } from './services/supabase';
import { PawPrint, Navigation, AlertTriangle, Eye, CheckCircle } from 'lucide-react';

export default function App() {
  const [reportes, setReportes] = useState([]);
  const [coordenadaSeleccionada, setCoordenadaSeleccionada] = useState(null);
  const [centroMapa, setCentroMapa] = useState([-34.6037, -58.5600]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('reportes_mapa')
        .select('*')
        .order('fecha_hora', { ascending: false });

      if (error) {
        console.error('Error al cargar reportes:', error);
      } else if (data) {
        setReportes(data);
      }
    } catch (err) {
      console.error('Error inesperado:', err);
    } finally {
      setCargando(false);
    }
  };

  const obtenerMiUbicacion = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCentroMapa([lat, lng]);
        setCoordenadaSeleccionada({ lat, lng });
      },
      (error) => {
        alert('No se pudo obtener la ubicación: ' + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Contadores dinámicos sincronizados directamente con la base de datos
  const totalPerdidos = reportes.filter((r) => String(r.tipo_alerta).toUpperCase() === 'PERDIDO' && !r.resuelto).length;
  const totalVistos = reportes.filter((r) => String(r.tipo_alerta).toUpperCase() === 'VISTO' && !r.resuelto).length;
  const totalEncontrados = reportes.filter((r) => r.resuelto === true).length;
  const totalVigentes = totalPerdidos + totalVistos;

  const fondoHuellas = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.06' fill-rule='evenodd'%3E%3Cpath d='M30 30c-2.2 0-4 1.8-4 4 0 2.2 1.8 5 4 5s4-2.8 4-5c0-2.2-1.8-4-4-4zm-6-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-9-5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z'/%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
      <header
        style={{
          background: `#1e3a8a ${fondoHuellas}`,
          color: '#ffffff',
          padding: '12px 16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#ffffff', color: '#1e3a8a', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PawPrint size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
                Siguiendo Huellas
              </h1>
              <span style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 600, letterSpacing: '0.5px' }}>
                SIG - Mascotas
              </span>
            </div>
          </div>

          <button
            onClick={obtenerMiUbicacion}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: '1px solid #60a5fa',
              padding: '8px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
            }}
          >
            <Navigation size={16} />
            <span>Mi GPS</span>
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            maxWidth: '1200px',
            margin: '10px auto 0 auto',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#bfdbfe', fontWeight: 600 }}>Vigentes</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{totalVigentes}</div>
          </div>

          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#fca5a5', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <AlertTriangle size={12} /> Perdidos
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fecaca' }}>{totalPerdidos}</div>
          </div>

          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '6px', padding: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#fde68a', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Eye size={12} /> Avistados
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fef3c7' }}>{totalVistos}</div>
          </div>

          <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: '6px', padding: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#86efac', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <CheckCircle size={12} /> Encontrados
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#bbf7d0' }}>{totalEncontrados}</div>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, position: 'relative', width: '100%' }}>
        <MapaInteractivo
          reportes={reportes}
          centro={centroMapa}
          coordenadaSeleccionada={coordenadaSeleccionada}
          onSeleccionarCoordenada={(coords) => setCoordenadaSeleccionada(coords)}
          onAlertaModificada={cargarReportes}
        />

        {cargando && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              zIndex: 999
            }}
          >
            Actualizando...
          </div>
        )}
      </main>

      <footer style={{ flexShrink: 0, zIndex: 1000, backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb' }}>
        <FormularioAlerta
          coordenadaSeleccionada={coordenadaSeleccionada}
          onAlertaGuardada={() => {
            setCoordenadaSeleccionada(null);
            cargarReportes();
          }}
        />
      </footer>
    </div>
  );
}