import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { subirFotoMascota } from '../services/storageService';
import { Camera, Send, Check } from 'lucide-react';

export default function FormularioAlerta({ coordenadaSeleccionada, onAlertaGuardada }) {
  const [tipoAlerta, setTipoAlerta] = useState('PERDIDO');
  const [descripcion, setDescripcion] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [foto, setFoto] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!coordenadaSeleccionada || !coordenadaSeleccionada.lat || !coordenadaSeleccionada.lng) {
      alert('Tocá primero un punto en el mapa o presioná Mi GPS.');
      return;
    }

    setSubiendo(true);
    try {
      let fotoUrl = null;
      if (foto) {
        fotoUrl = await subirFotoMascota(foto);
      }

      // Geometría PostGIS estándar WKT
      const puntoWKT = `SRID=4326;POINT(${coordenadaSeleccionada.lng} ${coordenadaSeleccionada.lat})`;

      // Enviar datos duplicando nombres de columna para compatibilidad total
      const { error } = await supabase.from('reportes_mapa').insert([
        {
          tipo_alerta: tipoAlerta.toUpperCase(),
          descripcion: descripcion || 'Sin descripción detallada',
          telefono_contacto: telefonoContacto || null,
          contacto_telefono: telefonoContacto || null,
          foto_url: fotoUrl,
          ubicacion: puntoWKT,
          resuelto: false
        }
      ]);

      if (error) {
        throw error;
      }

      // Limpiar campos y refrescar mapa
      setDescripcion('');
      setTelefonoContacto('');
      setFoto(null);

      if (onAlertaGuardada) {
        onAlertaGuardada();
      }

      alert('¡Alerta registrada con éxito en el mapa!');
    } catch (err) {
      console.error('Error al guardar en Supabase:', err);
      alert('Error al publicar: ' + (err.message || 'Error desconocido'));
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '10px 14px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr auto', gap: '8px', marginBottom: '8px' }}>
        <select
          value={tipoAlerta}
          onChange={(e) => setTipoAlerta(e.target.value)}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <option value="PERDIDO">Perdido</option>
          <option value="VISTO">Avistado</option>
        </select>

        <input
          type="tel"
          placeholder="Teléfono / WhatsApp de contacto"
          value={telefonoContacto}
          onChange={(e) => setTelefonoContacto(e.target.value)}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
        />

        <label
          style={{
            backgroundColor: foto ? '#16a34a' : '#2563eb',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            whiteSpace: 'nowrap'
          }}
        >
          {foto ? <Check size={16} /> : <Camera size={16} />}
          <span>{foto ? 'Foto lista' : 'Foto'}</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setFoto(e.target.files[0] || null)}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <input
          type="text"
          placeholder="Descripción (raza, collar, señas particulares...)"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
        />
      </div>

      <button
        type="submit"
        disabled={!coordenadaSeleccionada || subiendo}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: coordenadaSeleccionada ? '#2563eb' : '#9ca3af',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: coordenadaSeleccionada && !subiendo ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <Send size={16} />
        <span>
          {subiendo
            ? 'Publicando en el mapa...'
            : coordenadaSeleccionada
            ? `Publicar Alerta (${coordenadaSeleccionada.lat.toFixed(3)}, ${coordenadaSeleccionada.lng.toFixed(3)})`
            : 'Marcá el mapa o usá tu GPS para ubicar'}
        </span>
      </button>
    </form>
  );
}