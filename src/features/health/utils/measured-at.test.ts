import { describe, expect, it } from 'vitest'

import { toMeasuredAt } from './measured-at'

const AHORA = new Date(2026, 7, 14, 9, 30, 0)

describe('toMeasuredAt', () => {
  it('si es hoy, guarda el momento en que se apunta', () => {
    expect(toMeasuredAt('2026-08-14', AHORA)).toBe(AHORA.toISOString())
  })

  it('si es un día pasado, su mediodía', () => {
    // Uno recuerda que se midió «el domingo», no que fueron las 8:47: inventar
    // una hora exacta sería fingir precisión.
    const iso = toMeasuredAt('2026-08-12', AHORA)
    const fecha = new Date(iso ?? '')

    expect(fecha.getDate()).toBe(12)
    expect(fecha.getHours()).toBe(12)
  })

  it('el mediodía deja la medición dentro del día elegido', () => {
    // La medianoche podría caer en el día anterior según el huso; el mediodía no.
    const iso = toMeasuredAt('2026-08-01', AHORA)
    const fecha = new Date(iso ?? '')

    expect(fecha.getMonth()).toBe(7)
    expect(fecha.getDate()).toBe(1)
  })

  it('con una fecha que no se entiende devuelve nada, en vez de inventarla', () => {
    expect(toMeasuredAt('', AHORA)).toBeNull()
    expect(toMeasuredAt('el domingo', AHORA)).toBeNull()
  })
})
