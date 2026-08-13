import { describe, expect, it } from 'vitest'

import type { BodyMetric } from '../types/health.types'
import { buildMetricHistory } from './metric-history'

/** Una medición, con lo justo para lo que se prueba aquí. */
function reading(id: string, value: number, day: number, unit = 'cm'): BodyMetric {
  return {
    id,
    value,
    unit,
    measured_at: `2026-08-${String(day).padStart(2, '0')}T07:00:00.000Z`,
    metric_type: 'waist',
    user_id: 'quien-sea',
    created_at: '',
    updated_at: '',
    deleted_at: null,
  }
}

describe('buildMetricHistory', () => {
  it('cada lectura se compara con la anterior en el tiempo', () => {
    // Llegan de la más reciente a la más antigua, que es como se leen.
    const history = buildMetricHistory('waist', [
      reading('c', 88, 20),
      reading('b', 90, 10),
      reading('a', 93, 1),
    ])

    expect(history.readings.map(({ change }) => change)).toEqual([-2, -3, null])
  })

  it('la más antigua no tiene con qué compararse', () => {
    const history = buildMetricHistory('waist', [reading('b', 90, 10), reading('a', 93, 1)])

    expect(history.readings.at(-1)?.change).toBeNull()
  })

  it('el total mira los extremos del tramo, no las dos últimas', () => {
    // Es la diferencia entre las dos preguntas: la tarjeta dice «cómo estoy» y
    // esto dice «voy a algún sitio».
    const history = buildMetricHistory('waist', [
      reading('c', 88, 20),
      reading('b', 90, 10),
      reading('a', 93, 1),
    ])

    expect(history.totalChange).toBe(-5)
  })

  it('con una sola medición no inventa un recorrido', () => {
    // Un cero aquí se leería como «no has cambiado», y no es lo mismo que «no
    // hay con qué comparar».
    const history = buildMetricHistory('waist', [reading('a', 93, 1)])

    expect(history.totalChange).toBeNull()
    expect(history.readings).toHaveLength(1)
  })

  it('sin mediciones no revienta', () => {
    const history = buildMetricHistory('waist', [])

    expect(history.readings).toEqual([])
    expect(history.totalChange).toBeNull()
    expect(history.unit).toBe('cm')
  })

  it('respeta la unidad con la que se tomó la medición', () => {
    // Una lectura vieja conserva su unidad aunque hoy se use otra.
    const history = buildMetricHistory('weight', [reading('a', 200, 1, 'lb')])

    expect(history.unit).toBe('lb')
  })
})
