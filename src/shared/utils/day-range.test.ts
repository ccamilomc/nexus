import { describe, expect, it } from 'vitest'

import { dayRange } from './day-range'

describe('dayRange', () => {
  it('acota desde el inicio del día local hasta el inicio del siguiente', () => {
    const { fromIso, toIso } = dayRange(new Date(2026, 6, 25, 20, 30))

    expect(new Date(fromIso).getFullYear()).toBe(2026)
    expect(new Date(fromIso).getDate()).toBe(25)
    expect(new Date(fromIso).getHours()).toBe(0)
    expect(new Date(toIso).getDate()).toBe(26)
    expect(new Date(toIso).getHours()).toBe(0)
  })

  it('el rango dura exactamente un día', () => {
    const { fromIso, toIso } = dayRange(new Date(2026, 6, 25, 13, 0))
    const hours = (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 3_600_000

    expect(hours).toBe(24)
  })

  it('una comida de la noche cae en su propio día local, no en el siguiente', () => {
    const night = new Date(2026, 6, 25, 23, 45)
    const { fromIso, toIso } = dayRange(night)

    expect(night.getTime()).toBeGreaterThanOrEqual(new Date(fromIso).getTime())
    expect(night.getTime()).toBeLessThan(new Date(toIso).getTime())
  })
})
