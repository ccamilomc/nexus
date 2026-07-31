import { useToday } from '@/core/time'
import { formatMinutes } from '@/shared/utils'

import { useDayStudy, useWeekStudy } from './use-study'

/**
 * Resumen de estudio para otras pantallas (el dashboard).
 *
 * Devuelve frases ya formadas, no datos crudos: el módulo decide **cómo se
 * cuenta lo suyo** y quien lo muestra sólo lo coloca. Mismo contrato que
 * nutrición y hábitos.
 */
export interface StudySummary {
  readonly isPending: boolean
  /** No se ha estudiado nada esta semana. */
  readonly isEmpty: boolean
  readonly lines: readonly string[]
}

export function useStudySummary(): StudySummary {
  const today = useToday()
  const day = useDayStudy(today)
  const week = useWeekStudy(today)

  const isPending = day.isPending || week.isPending
  const todayMinutes = day.data?.totalMinutes ?? 0
  const weekMinutes = week.data?.totalMinutes ?? 0
  const progress = week.data?.progress ?? null

  const lines = [
    `Hoy: ${formatMinutes(todayMinutes)}`,
    // Con objetivo se dice el avance; sin él, sólo el tiempo de la semana.
    progress
      ? `Semana: ${formatMinutes(weekMinutes)} de ${formatMinutes(progress.target)}`
      : `Semana: ${formatMinutes(weekMinutes)}`,
  ]

  return {
    isPending,
    isEmpty: !isPending && todayMinutes === 0 && weekMinutes === 0,
    lines,
  }
}
