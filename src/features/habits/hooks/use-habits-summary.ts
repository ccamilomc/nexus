import { useMemo } from 'react'

import { useHabitsToday } from './use-habits'

/**
 * Resumen de hábitos para otras pantallas (el dashboard).
 *
 * Devuelve frases ya formadas, no datos crudos: el módulo decide **cómo se
 * cuenta lo suyo** y quien lo muestra sólo lo coloca. Mismo contrato que el de
 * nutrición, para que el dashboard no tenga que conocer rachas ni conteos.
 */
export interface HabitsSummary {
  readonly isPending: boolean
  /** No hay ningún hábito creado. */
  readonly isEmpty: boolean
  readonly lines: readonly string[]
}

export function useHabitsSummary(): HabitsSummary {
  const today = useMemo(() => new Date(), [])
  const { data, isPending } = useHabitsToday(today)

  const habits = data ?? []
  const doneCount = habits.filter((entry) => entry.isDoneToday).length
  const bestStreak = habits.reduce((best, entry) => Math.max(best, entry.streak), 0)

  const lines = [
    `${doneCount} de ${habits.length} ${habits.length === 1 ? 'hecho' : 'hechos'} hoy`,
    // La racha sólo se menciona cuando existe: sin ella no se recrimina nada.
    ...(bestStreak > 0
      ? [`Mejor racha: ${bestStreak === 1 ? '1 día' : `${bestStreak} días`}`]
      : []),
  ]

  return { isPending, isEmpty: !isPending && habits.length === 0, lines }
}
