import { describe, expect, it } from 'vitest'

import { elapsedMinutes } from './elapsed-minutes'

const START = new Date(2026, 6, 30, 18, 0)
const startIso = START.toISOString()

/** Un instante `minutes` minutos (y `seconds` segundos) después del inicio. */
function after(minutes: number, seconds = 0): Date {
  return new Date(START.getTime() + minutes * 60_000 + seconds * 1_000)
}

describe('elapsedMinutes', () => {
  it('cuenta los minutos completos', () => {
    expect(elapsedMinutes(startIso, after(50))).toBe(50)
  })

  it('redondea al minuto más cercano', () => {
    expect(elapsedMinutes(startIso, after(24, 40))).toBe(25)
    expect(elapsedMinutes(startIso, after(25, 20))).toBe(25)
  })

  it('una sesión muy corta cuenta como un minuto, no como cero', () => {
    // Guardar «0 min» sería como no haber registrado nada.
    expect(elapsedMinutes(startIso, after(0, 40))).toBe(1)
  })

  it('un reloj que va hacia atrás no produce duraciones negativas', () => {
    expect(elapsedMinutes(startIso, new Date(START.getTime() - 5 * 60_000))).toBe(1)
  })

  it('una fecha de inicio ilegible no rompe el guardado', () => {
    expect(elapsedMinutes('no es una fecha', after(30))).toBe(1)
  })

  it('cuenta bien las sesiones largas', () => {
    expect(elapsedMinutes(startIso, after(185))).toBe(185)
  })
})
