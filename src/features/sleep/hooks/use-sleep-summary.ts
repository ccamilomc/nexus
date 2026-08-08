import { useToday } from '@/core/time'
import type { DomainSummaryData, SummaryProgress } from '@/shared/types'
import { formatMinutes } from '@/shared/utils'

import { QUALITY_LABELS } from '../constants/sleep.constants'
import { useLastNight, useSleepGoal, useSleepHistory } from './use-sleep'

/**
 * Resumen de sueño para otras pantallas (el dashboard).
 *
 * Devuelve frases ya formadas, no datos crudos: el módulo decide **cómo se
 * cuenta lo suyo** y quien lo muestra sólo lo coloca.
 */
export type SleepSummary = DomainSummaryData

export function useSleepSummary(): SleepSummary {
  const today = useToday()
  const lastNight = useLastNight(today)
  const history = useSleepHistory()
  const goal = useSleepGoal()

  const isPending = lastNight.isPending || history.isPending || goal.isPending
  const log = lastNight.data ?? null
  const average = history.data?.averageMinutes ?? null
  const target = goal.data?.target_minutes ?? null

  // Sin objetivo no hay barra que pintar: tendría que inventarse el 100 %. Es
  // la misma regla que en nutrición, donde las barras sólo salen con metas.
  const progress: readonly SummaryProgress[] =
    log && target !== null
      ? [
          {
            label: 'Anoche',
            value: log.duration_minutes,
            target,
            display: `${formatMinutes(log.duration_minutes)} de ${formatMinutes(target)}`,
          },
        ]
      : []

  const quality =
    log === null || log.quality_rating === null ? null : QUALITY_LABELS[log.quality_rating]

  const lines = log
    ? [
        // Con barra, las horas de anoche ya están dibujadas: repetirlas en texto
        // haría leer dos veces lo mismo. Queda la calidad, que la barra no dice.
        ...(progress.length > 0
          ? quality === null
            ? []
            : [`Calidad: ${quality}`]
          : [
              `Anoche: ${formatMinutes(log.duration_minutes)}${quality === null ? '' : ` · ${quality}`}`,
            ]),
        ...(average === null ? [] : [`Media: ${formatMinutes(average)}`]),
      ]
    : []

  return { isPending, isEmpty: !isPending && log === null, lines, progress }
}
