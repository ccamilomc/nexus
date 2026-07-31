import { useToday } from '@/core/time'
import { formatMinutes } from '@/shared/utils'

import { QUALITY_LABELS } from '../constants/sleep.constants'
import { useLastNight, useSleepHistory } from './use-sleep'

/**
 * Resumen de sueño para otras pantallas (el dashboard).
 *
 * Devuelve frases ya formadas, no datos crudos: el módulo decide **cómo se
 * cuenta lo suyo** y quien lo muestra sólo lo coloca.
 */
export interface SleepSummary {
  readonly isPending: boolean
  /** No hay registro de anoche. */
  readonly isEmpty: boolean
  readonly lines: readonly string[]
}

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

  return { isPending, isEmpty: !isPending && log === null, lines }
}
