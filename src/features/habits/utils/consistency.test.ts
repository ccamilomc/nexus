import { describe, expect, it } from 'vitest'

import { toDateKey } from '@/shared/utils'

import { calculateConsistency } from './consistency'

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

/** Lo que antes era una fecha de creación: ahora, el predicado equivalente. */
const desde = (createdAt: Date) => (date: Date) => toDateKey(date) >= toDateKey(createdAt)

/** Un hábito viejo, para que la ventana no se recorte. */
const LONG_AGO = daysAgo(365)

describe('calculateConsistency', () => {
  it('cuenta los días cumplidos dentro de la ventana', () => {
    const result = calculateConsistency(completed(0, 1, 2), TODAY, 30, desde(LONG_AGO))

    expect(result.doneDays).toBe(3)
    expect(result.totalDays).toBe(30)
    expect(result.percent).toBe(10)
  })

  it('no cuenta días anteriores a la creación del hábito', () => {
    // Creado anteayer y cumplido los dos días: 2 de 3, no 2 de 30.
    const result = calculateConsistency(completed(0, 1), TODAY, 30, desde(daysAgo(2)))

    expect(result.doneDays).toBe(2)
    expect(result.totalDays).toBe(3)
    expect(result.percent).toBe(67)
  })

  it('un hábito recién creado y cumplido hoy va al 100 %', () => {
    const result = calculateConsistency(completed(0), TODAY, 30, desde(TODAY))

    expect(result).toEqual({ doneDays: 1, totalDays: 1, percent: 100 })
  })

  it('ignora los días cumplidos fuera de la ventana', () => {
    const result = calculateConsistency(completed(0, 40), TODAY, 30, desde(LONG_AGO))

    expect(result.doneDays).toBe(1)
  })

  it('sin cumplir nada queda a cero, sin dividir por cero', () => {
    const result = calculateConsistency(new Set(), TODAY, 30, desde(LONG_AGO))

    expect(result).toEqual({ doneDays: 0, totalDays: 30, percent: 0 })
  })

  it('un hábito creado en el futuro no rompe el cálculo', () => {
    const result = calculateConsistency(new Set(), TODAY, 30, desde(daysAgo(-5)))

    expect(result).toEqual({ doneDays: 0, totalDays: 0, percent: 0 })
  })
})

describe('calculateConsistency con días marcados', () => {
  /** Toca lunes, miércoles y viernes. */
  const lmv = (date: Date) => [1, 3, 5].includes(((date.getDay() + 6) % 7) + 1)

  it('los días que no tocan no entran en el denominador', () => {
    // Era el fallo: un hábito de tres días a la semana salía fallando cuatro
    // días de cada siete, y la constancia mentía.
    const result = calculateConsistency(new Set(), TODAY, 28, lmv)

    expect(result.totalDays).toBe(12)
  })

  it('cumplir todos los que tocan es el 100 %, aunque falten días del calendario', () => {
    const dias = new Set(
      Array.from({ length: 28 }, (_, i) => daysAgo(i))
        .filter(lmv)
        .map(toDateKey),
    )

    const result = calculateConsistency(dias, TODAY, 28, lmv)

    expect(result.percent).toBe(100)
  })
})
