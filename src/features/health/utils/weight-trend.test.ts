import { describe, expect, it } from 'vitest'

import type { BodyMetric } from '../types/health.types'
import { buildWeightTrend } from './weight-trend'

const HOY = new Date(2026, 7, 14, 9, 0)

/** Una pesada el día indicado, a mediodía. */
function pesada(dia: string, value: number): BodyMetric {
  const [year, month, day] = dia.split('-').map(Number)
  const at = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1, 12).toISOString()

  return {
    id: `${dia}-${value}`,
    user_id: 'user-1',
    metric_type: 'weight',
    value,
    unit: 'kg',
    measured_at: at,
    created_at: at,
    updated_at: at,
    deleted_at: null,
  }
}

describe('buildWeightTrend', () => {
  it('no inventa una tendencia cuando no hay pesadas suficientes', () => {
    // Con una a cada lado esto sería otra vez la resta entre dos pesadas.
    expect(buildWeightTrend([pesada('2026-08-10', 90), pesada('2026-07-25', 91)], HOY)).toBeNull()
    expect(buildWeightTrend([], HOY)).toBeNull()
  })

  it('tampoco la da si sólo hay datos de las últimas dos semanas', () => {
    // Sin el tramo anterior no hay con qué comparar.
    const trend = buildWeightTrend(
      [pesada('2026-08-12', 90), pesada('2026-08-08', 90.4), pesada('2026-08-04', 90.2)],
      HOY,
    )

    expect(trend).toBeNull()
  })

  it('promedia cada ventana y da el cambio por semana', () => {
    const trend = buildWeightTrend(
      [
        // Últimas dos semanas (desde el 1 de agosto): media 90.
        pesada('2026-08-12', 89.8),
        pesada('2026-08-05', 90.2),
        // Las dos anteriores (18 al 31 de julio): media 91.
        pesada('2026-07-28', 90.8),
        pesada('2026-07-20', 91.2),
      ],
      HOY,
    )

    expect(trend?.recentAverage).toBe(90)
    expect(trend?.previousAverage).toBe(91)
    // Un kilo entre los centros de las ventanas, que distan catorce días.
    expect(trend?.kgPerWeek).toBe(-0.5)
    expect(trend?.direction).toBe('down')
  })

  it('sobrevive al ruido que engaña a la resta entre dos pesadas', () => {
    // Caso tomado de los datos de prueba: las dos últimas pesadas dicen «+1,1 kg»
    // mientras el peso lleva un mes bajando.
    const trend = buildWeightTrend(
      [
        pesada('2026-08-08', 90),
        pesada('2026-08-03', 90.2),
        pesada('2026-08-02', 91.1),
        pesada('2026-07-29', 91.1),
        pesada('2026-07-27', 90.5),
        pesada('2026-07-24', 90.7),
        pesada('2026-07-22', 90.4),
        pesada('2026-07-19', 91.6),
      ],
      HOY,
    )

    expect(trend?.direction).toBe('down')
    expect(trend?.kgPerWeek).toBeLessThan(0)
  })

  it('llama estable a lo que sólo es ruido', () => {
    const trend = buildWeightTrend(
      [
        pesada('2026-08-12', 90),
        pesada('2026-08-05', 90.1),
        pesada('2026-07-28', 90.05),
        pesada('2026-07-20', 90.05),
      ],
      HOY,
    )

    expect(trend?.direction).toBe('stable')
  })

  it('cuenta con cuántas pesadas se calculó, para saber cuánto fiarse', () => {
    const trend = buildWeightTrend(
      [
        pesada('2026-08-12', 90),
        pesada('2026-08-05', 90),
        pesada('2026-07-28', 91),
        pesada('2026-07-26', 91),
        pesada('2026-07-20', 91),
      ],
      HOY,
    )

    expect(trend?.recentCount).toBe(2)
    expect(trend?.previousCount).toBe(3)
  })

  it('deja fuera lo anterior a las cuatro semanas', () => {
    // Un peso de hace tres meses no dice hacia dónde se va ahora.
    const trend = buildWeightTrend(
      [
        pesada('2026-08-12', 90),
        pesada('2026-08-05', 90),
        pesada('2026-07-28', 91),
        pesada('2026-07-20', 91),
        pesada('2026-05-23', 99),
      ],
      HOY,
    )

    expect(trend?.previousAverage).toBe(91)
    expect(trend?.previousCount).toBe(2)
  })

  it('también detecta la subida', () => {
    const trend = buildWeightTrend(
      [
        pesada('2026-08-12', 91.2),
        pesada('2026-08-05', 90.8),
        pesada('2026-07-28', 90.2),
        pesada('2026-07-20', 89.8),
      ],
      HOY,
    )

    expect(trend?.direction).toBe('up')
    expect(trend?.kgPerWeek).toBe(0.5)
  })
})
