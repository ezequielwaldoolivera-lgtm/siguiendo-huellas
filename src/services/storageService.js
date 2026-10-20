import { supabase } from './supabase';

export async function subirFotoMascota(archivo) {
  if (!archivo) return null;

  try {
    const extension = archivo.name.split('.').pop();
    const nombreArchivo = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extension}`;
    const ruta = `${nombreArchivo}`;

    const { error: uploadError } = await supabase.storage
      .from('mascotas-fotos')
      .upload(ruta, archivo, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.warn('Aviso en Storage:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from('mascotas-fotos')
      .getPublicUrl(ruta);

    return data?.publicUrl || null;
  } catch (err) {
    console.warn('Error no bloqueante al procesar foto:', err);
    return null;
  }
}