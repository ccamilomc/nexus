import { describe, expect, it } from 'vitest'

import { toDateKey } from '@/shared/utils'

import type { AnalyticsPeriod } from '../types/dashboard.types'
import { periodWindow } from './period'

const WEEK: AnalyticsPeriod = {
  id: '7d',
  label: '7 días',
  description: 'en los últimos 7 días',
  days: 7,
}

const TODAY = new Date(2026, 6, 29)

describe('periodWindow', () => {
  it('el periodo acaba hoy y tiene tantos días como pide', () => {
    const { days } = periodWindow(TODAY, WEEK)

    expect(days).toHaveLength(7)
    expect(toDateKey(days[0] as Date)).toBe('2026-07-23')
    expect(toDateKey(days[days.length - 1] as Date)).toBe('2026-07-29')
  })

  it('el periodo anterior es del mismo tamaño y acaba justo antes', () => {
    const { previousDays } = periodWindow(TODAY, WEEK)

    expect(previousDays).toHaveLength(7)
    expect(toDateKey(previousDays[0] as Date)).toBe('2026-07-16')
    expect(toDateKey(previousDays[previousDays.length - 1] as Date)).toBe('2026-07-22')
  })

  it('los dos tramos no se solapan ni dejan hueco', () => {
    const { range, previousRange } = periodWindow(TODAY, WEEK)

    expect(previousRange.toIso).toBe(range.fromIso)
  })

  it('el rango abarca el día entero, no el instante', () => {
    const { range } = periodWindow(TODAY, WEEK)

    // Empieza a medianoche local del primer día y acaba a medianoche del
    // siguiente al último: lo registrado a las 23:30 de hoy queda dentro.
    expect(range.fromIso).toBe(new Date(2026, 6, 23).toISOString())
    expect(range.toIso).toBe(new Date(2026, 6, 30).toISOString())
  })

  it('atraviesa el cambio de mes sin perder días', () => {
    const { days } = periodWindow(new Date(2026, 7, 2), WEEK)

    expect(days.map(toDateKey)).toEqual([
      '2026-07-27',
      '2026-07-28',
      '2026-07-29',
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
    ])
  })

  it('retroceder un periodo mueve el tramo entero, no solo el final', () => {
    const { days } = periodWindow(TODAY, WEEK, 1)

    // La semana anterior a la que acaba hoy: del 16 al 22 de julio.
    expect(days.map(toDateKey)[0]).toBe('2026-07-16')
    expect(days.map(toDateKey).at(-1)).toBe('2026-07-22')
  })

  it('el tramo de comparacion retrocede con el, para no cambiar la pregunta', () => {
    const { previousDays } = periodWindow(TODAY, WEEK, 1)

    expect(previousDays.map(toDateKey).at(-1)).toBe('2026-07-15')
  })

  it('sin retroceder se llama como siempre', () => {
    expect(periodWindow(TODAY, WEEK, 0).description).toBe(WEEK.description)
  })

  it('al retroceder dice las fechas: «los ultimos 7 dias» ya no seria cierto', () => {
    expect(periodWindow(TODAY, WEEK, 1).description).toBe('del 16 de jul al 22 de jul')
  })
})
