import type { DomainSummaryData } from '@/shared/types'

import { METRIC_LABELS } from '../constants/health.constants'
import { formatBmiValue, formatChange, formatValue } from '../utils/format'
import { useHealthOverview } from './use-health'

/**
 * Resumen de salud para otras pantallas (el dashboard).
 *
 * Devuelve frases ya formadas, no datos crudos: el módulo decide **cómo se
 * cuenta lo suyo** y quien lo muestra sólo lo coloca.
 */
export type HealthSummary = DomainSummaryData

export function useHealthSummary(): HealthSummary {
  const { data, isPending } = useHealthOverview()

  const metrics = data?.metrics ?? []
  // El peso primero si está; si no, la primera medida que haya.
  const main = metrics.find(({ type }) => type === 'weight') ?? metrics[0]

  const lines = main
    ? [
        `${METRIC_LABELS[main.type]}: ${formatValue(main.latest.value, main.latest.unit)}${
          main.change === null ? '' : ` (${formatChange(main.change, main.latest.unit)})`
        }`,
        ...(data?.bmi ? [`IMC: ${formatBmiValue(data.bmi.value)} · ${data.bmi.category}`] : []),
      ]
    : []

  // Sin barra, y no por falta de datos: **Salud no opina**. Dibujar el peso
  // avanzando hacia una meta convertiría un dato en un reproche.
  return { isPending, isEmpty: !isPending && metrics.length === 0, lines, progress: [] }
}
