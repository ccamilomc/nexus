import { describe, expect, it } from 'vitest'

import { weekRange } from './week-range'

describe('weekRange', () => {
  it('empieza el lunes, no el domingo', () => {
    // Miércoles 22 de julio de 2026.
    const { fromIso } = weekRange(new Date(2026, 6, 22, 15, 0))
    const start = new Date(fromIso)

    expect(start.getDay()).toBe(1)
    expect(start.getDate()).toBe(20)
    expect(start.getHours()).toBe(0)
  })

  it('el domingo pertenece a la semana que empezó el lunes anterior', () => {
    // Domingo 26 de julio de 2026: su semana arranca el lunes 20.
    const { fromIso } = weekRange(new Date(2026, 6, 26, 22, 0))

    expect(new Date(fromIso).getDate()).toBe(20)
  })

  it('un lunes es el primer día de su propia semana', () => {
    const { fromIso } = weekRange(new Date(2026, 6, 20, 8, 0))

    expect(new Date(fromIso).getDate()).toBe(20)
  })

  it('el rango dura exactamente siete días', () => {
    const { fromIso, toIso } = weekRange(new Date(2026, 6, 22))
    const days = (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86_400_000

    expect(days).toBe(7)
  })
})
