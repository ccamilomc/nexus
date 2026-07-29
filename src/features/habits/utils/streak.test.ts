import { describe, expect, it } from 'vitest'

import { toDateKey } from './date-key'
import { calculateStreak } from './streak'

/** Conjunto de fechas cumplidas a partir de desplazamientos desde `today`. */
function completed(today: Date, ...offsets: readonly number[]): Set<string> {
  return new Set(
    offsets.map((offset) => {
      const day = new Date(today)
      day.setDate(day.getDate() - offset)
      return toDateKey(day)
    }),
  )
}

const TODAY = new Date(2026, 6, 29)

describe('calculateStreak', () => {
  it('cuenta los días consecutivos incluyendo hoy', () => {
    expect(calculateStreak(completed(TODAY, 0, 1, 2), TODAY)).toBe(3)
  })

  it('no rompe la racha si hoy aún no está marcado', () => {
    // Ayer y anteayer hechos, hoy todavía no: el día no ha terminado.
    expect(calculateStreak(completed(TODAY, 1, 2), TODAY)).toBe(2)
  })

  it('se rompe en cuanto falta un día anterior', () => {
    // Hoy y ayer sí, pero anteayer no: la racha son 2.
    expect(calculateStreak(completed(TODAY, 0, 1, 3, 4), TODAY)).toBe(2)
  })

  it('sin registros la racha es cero', () => {
    expect(calculateStreak(new Set(), TODAY)).toBe(0)
  })

  it('marcar sólo hoy empieza una racha de uno', () => {
    expect(calculateStreak(completed(TODAY, 0), TODAY)).toBe(1)
  })

  it('un hueco de dos días no cuenta como racha aunque haya registros viejos', () => {
    expect(calculateStreak(completed(TODAY, 5, 6, 7), TODAY)).toBe(0)
  })

  it('atraviesa el cambio de mes', () => {
    // 1 de agosto: la racha viene del 31 y 30 de julio.
    const firstOfAugust = new Date(2026, 7, 1)

    expect(calculateStreak(completed(firstOfAugust, 0, 1, 2), firstOfAugust)).toBe(3)
  })
})
