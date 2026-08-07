import { useToday } from '@/core/time'
import type { DomainSummaryData } from '@/shared/types'
import { formatMinutes } from '@/shared/utils'

import { QUALITY_LABELS } from '../constants/sleep.constants'
import { useLastNight, useSleepHistory } from './use-sleep'

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

  const isPending = lastNight.isPending || history.isPending
  const log = lastNight.data ?? null
  const average = history.data?.averageMinutes ?? null

  const lines = log
    ? [
        `Anoche: ${formatMinutes(log.duration_minutes)}${
          log.quality_rating === null ? '' : ` · ${QUALITY_LABELS[log.quality_rating]}`
        }`,
        ...(average === null ? [] : [`Media: ${formatMinutes(average)}`]),
      ]
    : []

  // Sin barra todavía: el objetivo de sueño existe en la base de datos pero no
  // llega hasta aquí, y una barra sin meta tendría que inventarse el 100 %.
  return { isPending, isEmpty: !isPending && log === null, lines, progress: [] }
}
