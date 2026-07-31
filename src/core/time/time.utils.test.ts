import { describe, expect, it } from 'vitest'

import { msUntilNextTick, startOfDay } from './time.utils'

const MINUTE_MS = 60 * 1_000
const MARGIN_MS = 1_000

describe('startOfDay', () => {
  it('devuelve la medianoche local del día', () => {
    expect(startOfDay(new Date(2026, 6, 29, 23, 50, 12))).toEqual(new Date(2026, 6, 29))
  })

  it('no toca la fecha original', () => {
    const original = new Date(2026, 6, 29, 8, 30)
    startOfDay(original)

    expect(original.getHours()).toBe(8)
  })
})

describe('msUntilNextTick', () => {
  it('espera hasta la siguiente hora en punto', () => {
    const at = new Date(2026, 6, 29, 14, 23, 0, 0)

    expect(msUntilNextTick(at)).toBe(37 * MINUTE_MS + MARGIN_MS)
  })

  it('en la última hora del día apunta a la medianoche', () => {
    // Es el cruce que hace cambiar el día en toda la aplicación.
    const at = new Date(2026, 6, 29, 23, 30, 0, 0)

    expect(msUntilNextTick(at)).toBe(30 * MINUTE_MS + MARGIN_MS)
  })

  it('justo en la hora en punto espera una hora entera, no cero', () => {
    // Si devolviera cero, el temporizador se dispararía en bucle.
    const at = new Date(2026, 6, 29, 14, 0, 0, 0)

    expect(msUntilNextTick(at)).toBe(60 * MINUTE_MS + MARGIN_MS)
  })
})
