import { describe, expect, it } from 'vitest'

import type { BodyMetric, BodyMetricType } from '../types/health.types'
import { buildMetricSummaries } from './metric-summary'

const ORDER: readonly BodyMetricType[] = ['weight', 'body_fat', 'waist']

function metric(type: BodyMetricType, value: number, measuredAt: string): BodyMetric {
  return {
    id: `${type}-${measuredAt}`,
    user_id: 'user-1',
    metric_type: type,
    value,
    unit: type === 'weight' ? 'kg' : 'cm',
    measured_at: measuredAt,
    created_at: measuredAt,
    updated_at: measuredAt,
    deleted_at: null,
  }
}

describe('buildMetricSummaries', () => {
  it('sin mediciones no devuelve nada', () => {
    expect(buildMetricSummaries([], ORDER)).toEqual([])
  })

  it('toma la más reciente de cada tipo como actual', () => {
    // Llegan del más reciente al más antiguo.
    const summaries = buildMetricSummaries(
      [
        metric('weight', 74.5, '2026-07-31T08:00:00.000Z'),
        metric('weight', 75.2, '2026-07-24T08:00:00.000Z'),
      ],
      ORDER,
    )

    expect(summaries[0]?.latest.value).toBe(74.5)
    expect(summaries[0]?.previous?.value).toBe(75.2)
  })

  it('el cambio es una resta, sin juicio', () => {
    const summaries = buildMetricSummaries(
      [
        metric('weight', 74.5, '2026-07-31T08:00:00.000Z'),
        metric('weight', 75.2, '2026-07-24T08:00:00.000Z'),
      ],
      ORDER,
    )

    expect(summaries[0]?.change).toBe(-0.7)
  })

  it('la primera medición no tiene con qué compararse', () => {
    const summaries = buildMetricSummaries(
      [metric('weight', 74.5, '2026-07-31T08:00:00.000Z')],
      ORDER,
    )

    expect(summaries[0]?.change).toBeNull()
    expect(summaries[0]?.previous).toBeNull()
  })

  it('respeta el orden pedido, no el de llegada', () => {
    const summaries = buildMetricSummaries(
      [
        metric('waist', 82, '2026-07-31T08:00:00.000Z'),
        metric('weight', 74.5, '2026-07-31T08:00:00.000Z'),
      ],
      ORDER,
    )

    expect(summaries.map(({ type }) => type)).toEqual(['weight', 'waist'])
  })

  it('omite las medidas que nunca se han tomado', () => {
    const summaries = buildMetricSummaries(
      [metric('weight', 74.5, '2026-07-31T08:00:00.000Z')],
      ORDER,
    )

    expect(summaries).toHaveLength(1)
  })

  it('no arrastra los decimales de la coma flotante', () => {
    const summaries = buildMetricSummaries(
      [
        metric('weight', 74.1, '2026-07-31T08:00:00.000Z'),
        metric('weight', 73.9, '2026-07-24T08:00:00.000Z'),
      ],
      ORDER,
    )

    expect(summaries[0]?.change).toBe(0.2)
  })
})
