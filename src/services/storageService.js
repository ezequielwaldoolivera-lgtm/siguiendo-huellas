import { supabase } from './supabase';

/**
 * Sube una imagen al bucket 'mascotas-fotos' de Supabase y retorna la URL pública.
 * @param {File} archivo - Archivo de imagen seleccionado por el usuario.
 * @returns {Promise<string|null>} URL pública de la foto subida.
 */
export async function subirFotoMascota(archivo) {
  if (!archivo) return null;

  try {
    const extension = archivo.name.split('.').pop();
    const nombreLimpio = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const rutaArchivo = `fotos/${nombreLimpio}`;

    const { error: errorSubida } = await supabase.storage
      .from('mascotas-fotos')
      .upload(rutaArchivo, archivo, {
        cacheControl: '3600',
        upsert: false
      });

    if (errorSubida) {
      console.error('Error al subir imagen a Supabase Storage:', errorSubida);
      return null;
    }

    const { data } = supabase.storage
      .from('mascotas-fotos')
      .getPublicUrl(rutaArchivo);

    return data?.publicUrl || null;
  } catch (err) {
    console.error('Fallo inesperado al procesar la foto:', err);
    return null;
  }
}