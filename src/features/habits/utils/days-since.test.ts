import { describe, expect, it } from 'vitest'

import { daysSinceDone } from './days-since'

const HOY = new Date(2026, 7, 14)
/** Un hábito viejo: no limita la búsqueda hacia atrás. */
const CREADO_HACE_MESES = new Date(2026, 3, 1)

describe('daysSinceDone', () => {
  it('cuenta cero el día que se cumple', () => {
    expect(daysSinceDone(new Set(['2026-08-14']), HOY, CREADO_HACE_MESES)).toBe(0)
  })

  it('cuenta uno si fue ayer', () => {
    expect(daysSinceDone(new Set(['2026-08-13']), HOY, CREADO_HACE_MESES)).toBe(1)
  })

  it('cuenta hasta la última vez, saltándose los días en blanco', () => {
    // Con los datos de prueba: cumplido el 12, hoy es 14.
    expect(daysSinceDone(new Set(['2026-08-12', '2026-08-11']), HOY, CREADO_HACE_MESES)).toBe(2)
  })

  it('no dice nada de un hábito que nunca se ha marcado', () => {
    // Escribir «60 días» sería inventarse un pasado que no existe.
    expect(daysSinceDone(new Set(), HOY, CREADO_HACE_MESES)).toBeNull()
  })

  it('no cuenta los días anteriores a crear el hábito', () => {
    // Uno creado ayer y sin marcar todavía no se ha «dejado de hacer».
    expect(daysSinceDone(new Set(), HOY, new Date(2026, 7, 13))).toBeNull()
  })

  it('deja de mirar más allá de la ventana que se trae', () => {
    // El dato no está: mejor callar que dar una cifra inventada.
    expect(daysSinceDone(new Set(['2026-01-01']), HOY, CREADO_HACE_MESES)).toBeNull()
  })

  it('cruza el cambio de mes sin perderse', () => {
    expect(daysSinceDone(new Set(['2026-07-31']), new Date(2026, 7, 2), CREADO_HACE_MESES)).toBe(2)
  })
})
