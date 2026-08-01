import { describe, expect, it } from 'vitest'

import type { BodyMetric } from '../types/health.types'
import { buildWeightSeries } from './weight-series'

const DAYS = [new Date(2026, 6, 27), new Date(2026, 6, 28), new Date(2026, 6, 29)]

function weight(day: Date, value: number, hour = 8): BodyMetric {
  const at = new Date(day)
  at.setHours(hour, 0, 0, 0)

  return {
    id: `m-${day.getDate()}-${value}-${hour}`,
    user_id: 'u1',
    metric_type: 'weight',
    value,
    unit: 'kg',
    measured_at: at.toISOString(),
    created_at: at.toISOString(),
    updated_at: at.toISOString(),
    deleted_at: null,
  }
}

describe('buildWeightSeries', () => {
  it('coloca cada pesaje en su día', () => {
    const series = buildWeightSeries(
      [weight(DAYS[0] as Date, 75.4), weight(DAYS[2] as Date, 74.8)],
      DAYS,
    )

    expect(series.points).toEqual([
      { dateKey: '2026-07-27', value: 75.4 },
      { dateKey: '2026-07-28', value: null },
      { dateKey: '2026-07-29', value: 74.8 },
    ])
    expect(series.measurements).toBe(2)
  })

  it('un día sin pesarse es un hueco, no un cero', () => {
    const series = buildWeightSeries([], DAYS)

    expect(series.points.every(({ value }) => value === null)).toBe(true)
    expect(series.latestKg).toBeNull()
    expect(series.measurements).toBe(0)
  })

  it('si hay dos pesajes el mismo día se queda el último', () => {
    const series = buildWeightSeries(
      [weight(DAYS[0] as Date, 75.4, 8), weight(DAYS[0] as Date, 75.9, 20)],
      DAYS,
    )

    expect(series.points[0]?.value).toBe(75.9)
    // Pesarse dos veces no son dos días de datos.
    expect(series.measurements).toBe(1)
  })

  it('el cambio es la resta entre el primero y el último del periodo', () => {
    const series = buildWeightSeries(
      [weight(DAYS[0] as Date, 76), weight(DAYS[2] as Date, 74.5)],
      DAYS,
    )

    expect(series.changeKg).toBe(-1.5)
    expect(series.latestKg).toBe(74.5)
  })

  it('con un solo pesaje no hay cambio que dar', () => {
    expect(buildWeightSeries([weight(DAYS[1] as Date, 75)], DAYS).changeKg).toBeNull()
  })

  it('no devuelve nada que parezca un juicio', () => {
    // Ni dirección, ni objetivo, ni valoración: sólo la serie y la resta.
    const series = buildWeightSeries(
      [weight(DAYS[0] as Date, 74), weight(DAYS[2] as Date, 76)],
      DAYS,
    )

    expect(Object.keys(series).sort()).toEqual([
      'changeKg',
      'latestKg',
      'measurements',
      'points',
      'unit',
    ])
  })

  it('conserva la unidad de las mediciones', () => {
    expect(buildWeightSeries([weight(DAYS[0] as Date, 75)], DAYS).unit).toBe('kg')
    expect(buildWeightSeries([], DAYS).unit).toBe('kg')
  })
})
