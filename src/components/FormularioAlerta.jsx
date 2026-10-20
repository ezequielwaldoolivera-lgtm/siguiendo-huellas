import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { subirFotoMascota } from '../services/storageService';
import { Camera, Send, Check, AlertCircle, Link2, KeyRound } from 'lucide-react';

export default function FormularioAlerta({
  coordenadaSeleccionada,
  onAlertaGuardada,
  reportesActivos = [],
  casoVinculadoId = null,
  onCancelarVinculacion
}) {
  const [tipoAlerta, setTipoAlerta] = useState('PERDIDO');
  const [descripcion, setDescripcion] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [pinSeguridad, setPinSeguridad] = useState('');
  const [idPadreSeleccionado, setIdPadreSeleccionado] = useState(casoVinculadoId || '');
  const [foto, setFoto] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  React.useEffect(() => {
    if (casoVinculadoId) {
      setIdPadreSeleccionado(casoVinculadoId);
      setTipoAlerta('VISTO');
    }
  }, [casoVinculadoId]);

  const pinValido = pinSeguridad.trim().length >= 4;
  const formularioListo = Boolean(coordenadaSeleccionada && pinValido && !subiendo);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!coordenadaSeleccionada || !coordenadaSeleccionada.lat || !coordenadaSeleccionada.lng) {
      alert('Tocá un punto en el mapa o presioná Mi GPS.');
      return;
    }

    if (!pinValido) {
      alert('Ingresá un PIN de al menos 4 dígitos para que solo vos puedas cerrar la alerta.');
      return;
    }

    const lat = Number(coordenadaSeleccionada.lat);
    const lng = Number(coordenadaSeleccionada.lng);

    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      alert('Coordenadas no válidas.');
      return;
    }

    setSubiendo(true);
    try {
      let fotoUrl = null;
      if (foto) {
        fotoUrl = await subirFotoMascota(foto);
      }

      const nuevoReporte = {
        tipo_alerta: tipoAlerta.toUpperCase(),
        descripcion: descripcion || 'Sin descripción',
        telefono_contacto: telefonoContacto || null,
        contacto_telefono: telefonoContacto || null,
        foto_url: fotoUrl,
        lat: lat,
        lng: lng,
        ubicacion: `SRID=4326;POINT(${lng} ${lat})`,
        pin_seguridad: pinSeguridad.trim(),
        id_padre: idPadreSeleccionado || null,
        resuelto: false
      };

      const { data, error } = await supabase
        .from('reportes_mapa')
        .insert([nuevoReporte])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        localStorage.setItem(`pin_alerta_${data[0].id}`, pinSeguridad.trim());
      }

      setDescripcion('');
      setTelefonoContacto('');
      setPinSeguridad('');
      setIdPadreSeleccionado('');
      setFoto(null);
      if (onCancelarVinculacion) onCancelarVinculacion();

      if (onAlertaGuardada) {
        onAlertaGuardada(data && data[0] ? data[0] : nuevoReporte);
      }

      alert('¡Alerta publicada! Guardá tu PIN para cerrarla más adelante.');
    } catch (err) {
      console.error(err);
      alert('Error al publicar: ' + (err.message || 'Error desconocido'));
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
      {idPadreSeleccionado && (
        <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '6px 8px', fontSize: '0.75rem', color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Link2 size={13} /> Vinculado a caso existente
          </span>
          <button
            type="button"
            onClick={() => { setIdPadreSeleccionado(''); if (onCancelarVinculacion) onCancelarVinculacion(); }}
            style={{ background: 'none', border: 'none', color: '#b45309', fontWeight: 800, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      <div>
        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', marginBottom: '3px', display: 'block' }}>
          Estado
        </label>
        <select
          value={tipoAlerta}
          onChange={(e) => setTipoAlerta(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #a7f3d0',
            backgroundColor: '#ffffff',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#065f46',
            outline: 'none'
          }}
        >
          <option value="PERDIDO">🚨 Perdido (Busco a mi mascota)</option>
          <option value="VISTO">👀 Avistado (Lo vi deambulando)</option>
          <option value="RETENIDO">🏠 Retenido (Lo tengo bajo resguardo)</option>
        </select>
      </div>

      {tipoAlerta === 'VISTO' && !idPadreSeleccionado && (
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', marginBottom: '3px', display: 'block' }}>
            ¿Es un perro ya publicado? (Opcional)
          </label>
          <select
            value={idPadreSeleccionado}
            onChange={(e) => setIdPadreSeleccionado(e.target.value)}
            style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #a7f3d0', fontSize: '0.78rem', outline: 'none' }}
          >
            <option value="">-- Nuevo reporte suelto --</option>
            {reportesActivos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.tipo_alerta}: {(r.descripcion || 'Sin descripción').slice(0, 30)}...
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', marginBottom: '3px', display: 'block' }}>
          WhatsApp de Contacto
        </label>
        <input
          type="tel"
          placeholder="Ej: 11 2345 6789"
          value={telefonoContacto}
          onChange={(e) => setTelefonoContacto(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #a7f3d0', fontSize: '0.82rem', outline: 'none' }}
        />
      </div>

      <div>
        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', marginBottom: '3px', display: 'block' }}>
          PIN de Cierre (4 dígitos requeridos) *
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="password"
            maxLength={6}
            placeholder="Mínimo 4 dígitos para poder resolverla"
            value={pinSeguridad}
            onChange={(e) => setPinSeguridad(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 8px 8px 30px',
              borderRadius: '6px',
              border: pinValido ? '1px solid #10b981' : '1px solid #f87171',
              backgroundColor: pinValido ? '#ffffff' : '#fef2f2',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          />
          <KeyRound size={14} style={{ position: 'absolute', left: '9px', top: '10px', color: pinValido ? '#059669' : '#ef4444' }} />
        </div>
      </div>

      <div>
        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', marginBottom: '3px', display: 'block' }}>
          Descripción / Señas
        </label>
        <textarea
          rows={2}
          placeholder="Raza, tamaño, collar, hacia dónde iba..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #a7f3d0', fontSize: '0.82rem', outline: 'none', resize: 'none' }}
        />
      </div>

      <label
        style={{
          backgroundColor: foto ? '#059669' : '#10b981',
          color: '#ffffff',
          padding: '8px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          cursor: 'pointer',
          fontSize: '0.82rem',
          fontWeight: 600
        }}
      >
        {foto ? <Check size={15} /> : <Camera size={15} />}
        <span>{foto ? 'Foto lista' : 'Adjuntar Foto'}</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFoto(e.target.files[0] || null)}
          style={{ display: 'none' }}
        />
      </label>

      {coordenadaSeleccionada ? (
        <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '6px', fontSize: '0.73rem', color: '#065f46', textAlign: 'center' }}>
          📍 <b>Punto:</b> {coordenadaSeleccionada.lat.toFixed(4)}, {coordenadaSeleccionada.lng.toFixed(4)}
        </div>
      ) : (
        <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '6px', fontSize: '0.72rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <AlertCircle size={14} flexShrink={0} />
          <span>Tocá en el mapa o <b>Mi GPS</b> para marcar el lugar.</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!formularioListo}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: formularioListo ? '#047857' : '#9ca3af',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '0.85rem',
          cursor: formularioListo ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
      >
        <Send size={15} />
        <span>
          {subiendo
            ? 'Publicando...'
            : !coordenadaSeleccionada
            ? 'Marcá el mapa o GPS'
            : !pinValido
            ? 'Ingresá un PIN (mín 4 dígitos)'
            : 'Publicar Alerta'}
        </span>
      </button>
    </form>
  );
}