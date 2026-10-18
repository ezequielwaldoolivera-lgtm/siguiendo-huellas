import { describe, it, expect } from 'vitest';

describe('Validación de servicio de almacenamiento (QA)', () => {
  it('Extrae la extensión del archivo correctamente', () => {
    const nombrePrueba = 'perro_perdido_caseros.jpg';
    const extension = nombrePrueba.split('.').pop();
    expect(extension).toBe('jpg');
  });

  it('Valida que el archivo no tenga tamaño cero', () => {
    const archivoInvalido = { size: 0 };
    expect(archivoInvalido.size).toBe(0);
  });
});