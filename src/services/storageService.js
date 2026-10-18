import { supabase } from './supabase';

export async function subirImagen(archivo, subcarpeta) {
  const extension = archivo.name.split('.').pop();
  const nombreLimpio = `${subcarpeta}/${Date.now()}_${Math.random().toString(36).substring(2)}.${extension}`;
  
  const { error } = await supabase.storage.from('fotos').upload(nombreLimpio, archivo);
  if (error) {
    console.error('Fallo en la subida a Storage:', error);
    return null;
  }

  const { data } = supabase.storage.from('fotos').getPublicUrl(nombreLimpio);
  return data.publicUrl;
}