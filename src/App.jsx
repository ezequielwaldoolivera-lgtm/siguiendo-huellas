import React, { useState, useEffect } from 'react';
import MapaInteractivo from './components/MapaInteractivo';
import FormularioAlerta from './components/FormularioAlerta';
import { supabase } from './services/supabase';
import { PawPrint, Navigation, AlertTriangle, Eye, ShieldCheck, CheckCircle } from 'lucide-react';

export default function App() {
  const [reportes, setReportes] = useState([]);
  const [coordenadaSeleccionada, setCoordenadaSeleccionada] = useState(null);
  const [centroMapa, setCentroMapa] = useState([-34.6037, -58.5600]);
  const [casoVinculadoId, setCasoVinculadoId] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarReportes();

    const canal = supabase
      .channel('cambios-mapa-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reportes_mapa' },
        () => {
          cargarReportes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
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

  const reportesActivos = reportes.filter((r) => !r.resuelto);
  const totalPerdidos = reportes.filter((r) => String(r.tipo_alerta).toUpperCase() === 'PERDIDO' && !r.resuelto).length;
  const totalVistos = reportes.filter((r) => (String(r.tipo_alerta).toUpperCase() === 'VISTO' || String(r.tipo_alerta).toUpperCase() === 'AVISTADO') && !r.resuelto).length;
  const totalRetenidos = reportes.filter((r) => String(r.tipo_alerta).toUpperCase() === 'RETENIDO' && !r.resuelto).length;
  const totalEncontrados = reportes.filter((r) => r.resuelto === true).length;
  const totalVigentes = totalPerdidos + totalVistos + totalRetenidos;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
      
      {/* BARRA LATERAL IZQUIERDA */}
      <aside
        style={{
          width: '320px',
          minWidth: '290px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #d1fae5',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          boxShadow: '2px 0 10px rgba(6, 78, 59, 0.08)'
        }}
      >
        <div style={{ backgroundColor: '#064e3b', padding: '12px 14px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '5px', borderRadius: '50%', display: 'flex' }}>
              <PawPrint size={18} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ecfdf5' }}>
                Siguiendo Huellas
              </h1>
              <span style={{ fontSize: '0.7rem', color: '#a7f3d0', fontWeight: 600 }}>
                SIG - Mascotas
              </span>
            </div>
          </div>

          <button
            onClick={obtenerMiUbicacion}
            title="Ubicar mi posición"
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              border: '1px solid #34d399',
              padding: '5px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 700,
              fontSize: '0.72rem',
              cursor: 'pointer'
            }}
          >
            <Navigation size={12} />
            <span>Mi GPS</span>
          </button>
        </div>

        <div style={{ flex: 1, padding: '12px', overflowY: 'auto', backgroundColor: '#f0fdf4' }}>
          <FormularioAlerta
            coordenadaSeleccionada={coordenadaSeleccionada}
            reportesActivos={reportesActivos}
            casoVinculadoId={casoVinculadoId}
            onCancelarVinculacion={() => setCasoVinculadoId(null)}
            onAlertaGuardada={() => {
              setCoordenadaSeleccionada(null);
              setCasoVinculadoId(null);
              cargarReportes();
            }}
          />
        </div>
      </aside>

      {/* ÁREA PRINCIPAL: CONTADORES SUPERIORES + MAPA */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        
        <div
          style={{
            backgroundColor: '#065f46',
            padding: '6px 10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            zIndex: 900,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ backgroundColor: '#047857', border: '1px solid #10b981', borderRadius: '6px', padding: '3px 9px', textAlign: 'center', minWidth: '70px' }}>
            <div style={{ fontSize: '0.62rem', color: '#a7f3d0', fontWeight: 700 }}>Vigentes</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>{totalVigentes}</div>
          </div>

          <div style={{ backgroundColor: '#991b1b', border: '1px solid #ef4444', borderRadius: '6px', padding: '3px 9px', textAlign: 'center', minWidth: '70px' }}>
            <div style={{ fontSize: '0.62rem', color: '#fca5a5', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
              <AlertTriangle size={10} /> Perdidos
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fee2e2' }}>{totalPerdidos}</div>
          </div>

          <div style={{ backgroundColor: '#b45309', border: '1px solid #f59e0b', borderRadius: '6px', padding: '3px 9px', textAlign: 'center', minWidth: '70px' }}>
            <div style={{ fontSize: '0.62rem', color: '#fde68a', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
              <Eye size={10} /> Avistados
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fef3c7' }}>{totalVistos}</div>
          </div>

          <div style={{ backgroundColor: '#0369a1', border: '1px solid #38bdf8', borderRadius: '6px', padding: '3px 9px', textAlign: 'center', minWidth: '70px' }}>
            <div style={{ fontSize: '0.62rem', color: '#bae6fd', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
              <ShieldCheck size={10} /> Retenidos
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#e0f2fe' }}>{totalRetenidos}</div>
          </div>

          <div style={{ backgroundColor: '#064e3b', border: '1px solid #34d399', borderRadius: '6px', padding: '3px 9px', textAlign: 'center', minWidth: '70px' }}>
            <div style={{ fontSize: '0.62rem', color: '#6ee7b7', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
              <CheckCircle size={10} /> Encontrados
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#d1fae5' }}>{totalEncontrados}</div>
          </div>

          {cargando && (
            <div style={{ fontSize: '0.68rem', color: '#a7f3d0', fontStyle: 'italic', marginLeft: '6px' }}>
              Sincronizando...
            </div>
          )}
        </div>

        <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
          <MapaInteractivo
            reportes={reportes}
            centro={centroMapa}
            coordenadaSeleccionada={coordenadaSeleccionada}
            onSeleccionarCoordenada={(coords) => setCoordenadaSeleccionada(coords)}
            onAlertaModificada={cargarReportes}
            onVincularAvistamiento={(id) => setCasoVinculadoId(id)}
          />
        </div>
      </main>

    </div>
  );
}