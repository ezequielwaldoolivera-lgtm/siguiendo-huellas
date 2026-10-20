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
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        gap: '12px',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
        {idPadreSeleccionado && (
          <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '6px 10px', fontSize: '0.75rem', color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
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

        {/* ESTADO */}
        <div>
          <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#064e3b', textTransform: 'uppercase', marginBottom: '4px', display: 'block', textAlign: 'center', letterSpacing: '0.5px' }}>
            Estado
          </label>
          <select
            value={tipoAlerta}
            onChange={(e) => setTipoAlerta(e.target.value)}
            style={{
              width: '100%',
              padding: '9px',
              borderRadius: '8px',
              border: '1px solid #a7f3d0',
              backgroundColor: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 700,
              color: '#065f46',
              outline: 'none',
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            <option value="PERDIDO">🚨 Perdido (Busco a mi mascota)</option>
            <option value="VISTO">👀 Avistado (Lo vi deambulando)</option>
            <option value="RETENIDO">🏠 Retenido (Lo tengo bajo resguardo)</option>
          </select>
        </div>

        {tipoAlerta === 'VISTO' && !idPadreSeleccionado && (
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', marginBottom: '3px', display: 'block', textAlign: 'center' }}>
              ¿Es un perro ya publicado? (Opcional)
            </label>
            <select
              value={idPadreSeleccionado}
              onChange={(e) => setIdPadreSeleccionado(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '0.78rem', outline: 'none', textAlign: 'center' }}
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

        {/* WHATSAPP */}
        <div>
          <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#064e3b', textTransform: 'uppercase', marginBottom: '4px', display: 'block', textAlign: 'center', letterSpacing: '0.5px' }}>
            WhatsApp de Contacto
          </label>
          <input
            type="tel"
            placeholder="Ej: 11 2345 6789"
            value={telefonoContacto}
            onChange={(e) => setTelefonoContacto(e.target.value)}
            style={{
              width: '100%',
              padding: '9px',
              borderRadius: '8px',
              border: '1px solid #a7f3d0',
              fontSize: '0.84rem',
              outline: 'none',
              textAlign: 'center',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* PIN */}
        <div>
          <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#064e3b', textTransform: 'uppercase', marginBottom: '4px', display: 'block', textAlign: 'center', letterSpacing: '0.5px' }}>
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
                padding: '9px 12px 9px 34px',
                borderRadius: '8px',
                border: pinValido ? '1px solid #10b981' : '1px solid #f87171',
                backgroundColor: pinValido ? '#ffffff' : '#fef2f2',
                fontSize: '0.84rem',
                outline: 'none',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}
            />
            <KeyRound size={15} style={{ position: 'absolute', left: '11px', top: '11px', color: pinValido ? '#059669' : '#ef4444' }} />
          </div>
        </div>

        {/* DESCRIPCIÓN */}
        <div>
          <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#064e3b', textTransform: 'uppercase', marginBottom: '4px', display: 'block', textAlign: 'center', letterSpacing: '0.5px' }}>
            Descripción / Señas
          </label>
          <textarea
            rows={3}
            placeholder="Raza, tamaño, collar, hacia dónde iba..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={{
              width: '100%',
              padding: '9px',
              borderRadius: '8px',
              border: '1px solid #a7f3d0',
              fontSize: '0.84rem',
              outline: 'none',
              resize: 'none',
              textAlign: 'center',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* FOTO */}
        <label
          style={{
            backgroundColor: foto ? '#059669' : '#10b981',
            color: '#ffffff',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '0.84rem',
            fontWeight: 700,
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
          }}
        >
          {foto ? <Check size={16} /> : <Camera size={16} />}
          <span>{foto ? 'Foto adjuntada' : 'Adjuntar Foto'}</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setFoto(e.target.files[0] || null)}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* BLOQUE INFERIOR DE ACCIÓN (UBICACIÓN Y BOTÓN) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
        {coordenadaSeleccionada ? (
          <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '8px', fontSize: '0.75rem', color: '#065f46', textAlign: 'center', fontWeight: 600 }}>
            📍 Ubicación: {coordenadaSeleccionada.lat.toFixed(4)}, {coordenadaSeleccionada.lng.toFixed(4)}
          </div>
        ) : (
          <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px', fontSize: '0.74rem', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textAlign: 'center' }}>
            <AlertCircle size={15} flexShrink={0} />
            <span>Tocá en el mapa o <b>Mi GPS</b> para marcar.</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!formularioListo}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: formularioListo ? '#047857' : '#9ca3af',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: formularioListo ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: formularioListo ? '0 3px 8px rgba(4,120,87,0.3)' : 'none',
            letterSpacing: '0.3px'
          }}
        >
          <Send size={16} />
          <span>
            {subiendo
              ? 'Publicando...'
              : !coordenadaSeleccionada
              ? 'Marcá el mapa o GPS'
              : !pinValido
              ? 'Ingresá PIN (4 dígitos)'
              : 'Publicar Alerta'}
          </span>
        </button>
      </div>
    </form>
  );
}