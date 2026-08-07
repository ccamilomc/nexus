import { useToday } from '@/core/time'
import type { DomainSummaryData } from '@/shared/types'
import { formatMinutes } from '@/shared/utils'

import { useDayStudy, useWeekStudy } from './use-study'

/**
 * Resumen de estudio para otras pantallas (el dashboard).
 *
 * El módulo decide **cómo se cuenta lo suyo** y quien lo muestra sólo lo coloca.
 * El objetivo de estudio es **semanal** y no diario a propósito: estudiar va a
 * rachas, y una meta diaria pintaría en rojo los martes que no tocaba.
 */
export type StudySummary = DomainSummaryData

export function useStudySummary(): StudySummary {
  const today = useToday()
  const day = useDayStudy(today)
  const week = useWeekStudy(today)

  const isPending = day.isPending || week.isPending
  const todayMinutes = day.data?.totalMinutes ?? 0
  const weekMinutes = week.data?.totalMinutes ?? 0
  const weekGoal = week.data?.progress ?? null

  return {
    isPending,
    isEmpty: !isPending && todayMinutes === 0 && weekMinutes === 0,
    lines: [
      `Hoy: ${formatMinutes(todayMinutes)}`,
      // Sin objetivo la semana se queda en frase: no hay hacia dónde avanzar.
      ...(weekGoal ? [] : [`Semana: ${formatMinutes(weekMinutes)}`]),
    ],
    progress: weekGoal
      ? [
          {
            label: 'Esta semana',
            value: weekMinutes,
            target: weekGoal.target,
            display: `${formatMinutes(weekMinutes)} de ${formatMinutes(weekGoal.target)}`,
          },
        ]
      : [],
  }
}
