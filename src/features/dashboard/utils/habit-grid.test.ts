import { describe, expect, it } from 'vitest'

import { buildHabitGrid, intensityOf } from './habit-grid'

/** Lunes = 0. En las pruebas se declara a mano para no depender del calendario. */
const WEEKDAYS: Record<string, number> = {
  '2026-08-10': 0,
  '2026-08-11': 1,
  '2026-08-12': 2,
  '2026-08-13': 3,
  '2026-08-14': 4,
  '2026-08-15': 5,
  '2026-08-16': 6,
  '2026-08-17': 0,
}
const weekdayOf = (dateKey: string) => WEEKDAYS[dateKey] ?? 0

const point = (dateKey: string, value: number | null) => ({ dateKey, value })

describe('buildHabitGrid', () => {
  it('agrupa los días en semanas de siete', () => {
    const points = Object.keys(WEEKDAYS).map((dateKey) => point(dateKey, 100))

    const weeks = buildHabitGrid(points, weekdayOf)

    expect(weeks).toHaveLength(2)
    expect(weeks[0]).toHaveLength(7)
    expect(weeks[1]).toHaveLength(1)
  })

  it('rellena por delante para que cada fila sea siempre el mismo día', () => {
    // Empezando un miércoles, las dos primeras casillas son huecos: si no, el
    // miércoles caería en la fila del lunes y el patrón semanal mentiría.
    const weeks = buildHabitGrid([point('2026-08-12', 50)], weekdayOf)

    expect(weeks[0]?.slice(0, 3)).toEqual([
      { dateKey: null, value: null },
      { dateKey: null, value: null },
      { dateKey: '2026-08-12', value: 50 },
    ])
  })

  it('sin días no dibuja nada', () => {
    expect(buildHabitGrid([], weekdayOf)).toEqual([])
  })
})

describe('intensityOf', () => {
  it('un día sin hábitos no es un cero: es ausencia', () => {
    expect(intensityOf(null)).toBeNull()
  })

  it('cerrar el día completo tiene su propio escalón', () => {
    expect(intensityOf(100)).toBe(4)
    expect(intensityOf(99)).toBe(3)
  })

  it('no cumplir nada es el escalón más bajo, pero se pinta', () => {
    expect(intensityOf(0)).toBe(0)
  })

  it('reparte lo de en medio en tres escalones', () => {
    expect(intensityOf(20)).toBe(1)
    expect(intensityOf(50)).toBe(2)
    expect(intensityOf(80)).toBe(3)
  })
})
