import React, { useState, useEffect } from 'react';
import MapaInteractivo from './components/MapaInteractivo';
import FormularioAlerta from './components/FormularioAlerta';
import { supabase } from './services/supabase';
import { PawPrint, Navigation, AlertTriangle, Eye, ShieldCheck, CheckCircle } from 'lucide-react';

// Patrón SVG repetible de huellitas sutiles para fondos
const fondoHuellitas = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60' opacity='0.08'%3E%3Cg fill='%23ffffff'%3E%3Cellipse cx='20' cy='22' rx='2.2' ry='3' transform='rotate(-20 20 22)'/%3E%3Cellipse cx='27' cy='18' rx='2.2' ry='3' transform='rotate(-5 27 18)'/%3E%3Cellipse cx='34' cy='18' rx='2.2' ry='3' transform='rotate(5 34 18)'/%3E%3Cellipse cx='41' cy='22' rx='2.2' ry='3' transform='rotate(20 41 22)'/%3E%3Cpath d='M23 27 C23 24, 38 24, 38 27 C38 33, 35 36, 30.5 36 C26 36, 23 33, 23 27 Z'/%3E%3C/g%3E%3C/svg%3E")`;

const fondoHuellitasLateral = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 60 60' opacity='0.05'%3E%3Cg fill='%23064e3b'%3E%3Cellipse cx='20' cy='22' rx='2.2' ry='3' transform='rotate(-20 20 22)'/%3E%3Cellipse cx='27' cy='18' rx='2.2' ry='3' transform='rotate(-5 27 18)'/%3E%3Cellipse cx='34' cy='18' rx='2.2' ry='3' transform='rotate(5 34 18)'/%3E%3Cellipse cx='41' cy='22' rx='2.2' ry='3' transform='rotate(20 41 22)'/%3E%3Cpath d='M23 27 C23 24, 38 24, 38 27 C38 33, 35 36, 30.5 36 C26 36, 23 33, 23 27 Z'/%3E%3C/g%3E%3C/svg%3E")`;

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
      
      {/* 1. BARRA LATERAL IZQUIERDA */}
      <aside
        style={{
          width: '340px',
          minWidth: '320px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #d1fae5',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          boxShadow: '3px 0 12px rgba(6, 78, 59, 0.08)'
        }}
      >
        {/* Cabecera lateral: altura fija exacta de 64px para alinear con la barra superior */}
        <div
          style={{
            height: '64px',
            backgroundColor: '#064e3b',
            backgroundImage: fondoHuellitas,
            padding: '0 16px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            borderRight: '1px solid #047857'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '6px', borderRadius: '50%', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
              <PawPrint size={19} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ecfdf5', letterSpacing: '-0.3px' }}>
                Siguiendo Huellas
              </h1>
              <span style={{ fontSize: '0.72rem', color: '#a7f3d0', fontWeight: 700 }}>
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
              padding: '6px 11px',
              borderRadius: '7px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 800,
              fontSize: '0.74rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <Navigation size={13} />
            <span>Mi GPS</span>
          </button>
        </div>

        {/* Formulario lateral distribuido ocupando todo el alto */}
        <div
          style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            backgroundColor: '#f0fdf4',
            backgroundImage: fondoHuellitasLateral,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
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

      {/* 2. ÁREA PRINCIPAL: CONTADORES SUPERIORES + MAPA */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        
        {/* Barra superior de contadores: altura idéntica de 64px, alineación al ras */}
        <div
          style={{
            height: '64px',
            backgroundColor: '#064e3b',
            backgroundImage: fondoHuellitas,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 900,
            boxSizing: 'border-box',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}
        >
          {/* Contenedor flexible que distribuye los 5 bloques ocupando la masa visual central */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              maxWidth: '820px'
            }}
          >
            {/* VIGENTES */}
            <div style={{ flex: 1, backgroundColor: '#047857', border: '1px solid #10b981', borderRadius: '8px', padding: '5px 8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '0.66rem', color: '#a7f3d0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Vigentes</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.2 }}>{totalVigentes}</div>
            </div>

            {/* PERDIDOS */}
            <div style={{ flex: 1, backgroundColor: '#991b1b', border: '1px solid #ef4444', borderRadius: '8px', padding: '5px 8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '0.66rem', color: '#fca5a5', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                <AlertTriangle size={11} /> Perdidos
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fee2e2', lineHeight: 1.2 }}>{totalPerdidos}</div>
            </div>

            {/* AVISTADOS */}
            <div style={{ flex: 1, backgroundColor: '#b45309', border: '1px solid #f59e0b', borderRadius: '8px', padding: '5px 8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '0.66rem', color: '#fde68a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                <Eye size={11} /> Avistados
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fef3c7', lineHeight: 1.2 }}>{totalVistos}</div>
            </div>

            {/* RETENIDOS */}
            <div style={{ flex: 1, backgroundColor: '#0369a1', border: '1px solid #38bdf8', borderRadius: '8px', padding: '5px 8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '0.66rem', color: '#bae6fd', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                <ShieldCheck size={11} /> Retenidos
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#e0f2fe', lineHeight: 1.2 }}>{totalRetenidos}</div>
            </div>

            {/* ENCONTRADOS */}
            <div style={{ flex: 1, backgroundColor: '#064e3b', border: '1px solid #34d399', borderRadius: '8px', padding: '5px 8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '0.66rem', color: '#6ee7b7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                <CheckCircle size={11} /> Encontrados
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#d1fae5', lineHeight: 1.2 }}>{totalEncontrados}</div>
            </div>
          </div>

          {cargando && (
            <div style={{ fontSize: '0.7rem', color: '#a7f3d0', fontStyle: 'italic', position: 'absolute', right: '16px' }}>
              Sincronizando...
            </div>
          )}
        </div>

        {/* MAPA A PANTALLA COMPLETA */}
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