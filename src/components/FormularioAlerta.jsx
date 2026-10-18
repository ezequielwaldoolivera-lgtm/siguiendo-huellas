import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { subirImagen } from '../services/storageService';
import { supabase } from '../services/supabase';

export default function FormularioAlerta({ puntoSeleccionado, onReporteCreado }) {
  const [tipoAlerta, setTipoAlerta] = useState('perdido');
  const [telefono, setTelefono] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puntoSeleccionado) {
      alert('Marcá un punto en el mapa o usá tu GPS.');
      return;
    }

    setCargando(true);
    let fotoUrl = null;
    if (archivo) {
      fotoUrl = await subirImagen(archivo, 'mascotas');
    }

    const { error } = await supabase.from('reportes_mapa').insert([
      {
        tipo_alerta: tipoAlerta,
        descripcion,
        contacto_telefono: telefono,
        latitud: puntoSeleccionado.lat,
        longitud: puntoSeleccionado.lng,
        foto_url: fotoUrl,
      },
    ]);

    setCargando(false);

    if (!error) {
      setDescripcion('');
      setTelefono('');
      setArchivo(null);
      onReporteCreado();
    } else {
      console.error(error);
      alert(`Error de base de datos: ${error?.message || error?.details || JSON.stringify(error)}`);
    }
  };

  return (
    <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #cbd5e1' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '650px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select 
            value={tipoAlerta} 
            onChange={(e) => setTipoAlerta(e.target.value)} 
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="perdido">Perro Perdido</option>
            <option value="avistado">Perro Visto</option>
            <option value="encontrado">Perro Retenido</option>
          </select>
          <input 
            type="tel" 
            placeholder="WhatsApp (ej: 1123456789)" 
            value={telefono} 
            onChange={(e) => setTelefono(e.target.value)} 
            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
            required 
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="Descripción (raza, collar, características)..." 
            value={descripcion} 
            onChange={(e) => setDescripcion(e.target.value)} 
            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
            required 
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', background: archivo ? '#16a34a' : '#475569', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
            <Camera size={16} />
            <span>{archivo ? 'Foto cargada' : 'Foto'}</span>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              style={{ display: 'none' }} 
              onChange={(e) => setArchivo(e.target.files[0])} 
            />
          </label>
        </div>

        <button 
          type="submit" 
          disabled={cargando || !puntoSeleccionado} 
          style={{ 
            padding: '10px', 
            background: !puntoSeleccionado ? '#94a3b8' : cargando ? '#64748b' : '#16a34a', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            fontWeight: 'bold', 
            cursor: puntoSeleccionado && !cargando ? 'pointer' : 'not-allowed' 
          }}
        >
          {cargando ? 'Registrando alerta...' : puntoSeleccionado ? 'Publicar en el Mapa' : 'Marcá el mapa o usá tu GPS'}
        </button>
      </form>
    </div>
  );
}