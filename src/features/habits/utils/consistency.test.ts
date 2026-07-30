import { describe, expect, it } from 'vitest'

import { calculateConsistency } from './consistency'
import { toDateKey } from './date-key'

const TODAY = new Date(2026, 6, 29)

function daysAgo(offset: number): Date {
  const day = new Date(TODAY)
  day.setDate(day.getDate() - offset)
  return day
}

/** Fechas cumplidas a partir de desplazamientos desde hoy. */
function completed(...offsets: readonly number[]): Set<string> {
  return new Set(offsets.map((offset) => toDateKey(daysAgo(offset))))
}

/** Un hábito viejo, para que la ventana no se recorte. */
const LONG_AGO = daysAgo(365)

describe('calculateConsistency', () => {
  it('cuenta los días cumplidos dentro de la ventana', () => {
    const result = calculateConsistency(completed(0, 1, 2), TODAY, 30, LONG_AGO)

    expect(result.doneDays).toBe(3)
    expect(result.totalDays).toBe(30)
    expect(result.percent).toBe(10)
  })

  it('no cuenta días anteriores a la creación del hábito', () => {
    // Creado anteayer y cumplido los dos días: 2 de 3, no 2 de 30.
    const result = calculateConsistency(completed(0, 1), TODAY, 30, daysAgo(2))

    expect(result.doneDays).toBe(2)
    expect(result.totalDays).toBe(3)
    expect(result.percent).toBe(67)
  })

  it('un hábito recién creado y cumplido hoy va al 100 %', () => {
    const result = calculateConsistency(completed(0), TODAY, 30, TODAY)

    expect(result).toEqual({ doneDays: 1, totalDays: 1, percent: 100 })
  })

  it('ignora los días cumplidos fuera de la ventana', () => {
    const result = calculateConsistency(completed(0, 40), TODAY, 30, LONG_AGO)

    expect(result.doneDays).toBe(1)
  })

  it('sin cumplir nada queda a cero, sin dividir por cero', () => {
    const result = calculateConsistency(new Set(), TODAY, 30, LONG_AGO)

    expect(result).toEqual({ doneDays: 0, totalDays: 30, percent: 0 })
  })

  it('un hábito creado en el futuro no rompe el cálculo', () => {
    const result = calculateConsistency(new Set(), TODAY, 30, daysAgo(-5))

    expect(result).toEqual({ doneDays: 0, totalDays: 0, percent: 0 })
  })
})
