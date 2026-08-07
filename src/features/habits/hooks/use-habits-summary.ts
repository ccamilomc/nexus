import { useToday } from '@/core/time'
import type { DomainSummaryData } from '@/shared/types'

import { useHabitsToday } from './use-habits'

/**
 * Resumen de hábitos para otras pantallas (el dashboard).
 *
 * El módulo decide **cómo se cuenta lo suyo** y quien lo muestra sólo lo coloca:
 * el dashboard no sabe de rachas ni de conteos. Los hábitos del día son el único
 * avance con meta; la racha es una frase, porque no va hacia ningún sitio.
 */
export type HabitsSummary = DomainSummaryData

export function useHabitsSummary(): HabitsSummary {
  const today = useToday()
  const { data, isPending } = useHabitsToday(today)

  const habits = data ?? []
  const doneCount = habits.filter((entry) => entry.isDoneToday).length
  const bestStreak = habits.reduce((best, entry) => Math.max(best, entry.streak), 0)

  return {
    isPending,
    isEmpty: !isPending && habits.length === 0,
    // La racha sólo se menciona cuando existe: sin ella no se recrimina nada.
    lines:
      bestStreak > 0 ? [`Mejor racha: ${bestStreak === 1 ? '1 día' : `${bestStreak} días`}`] : [],
    progress:
      habits.length > 0
        ? [
            {
              // «Hoy» y no «Hábitos»: la etiqueta va dentro de la tarjeta de
              // hábitos, y repetir el nombre sólo hace tartamudear la pantalla.
              label: 'Hoy',
              value: doneCount,
              target: habits.length,
              display: `${doneCount} de ${habits.length} ${habits.length === 1 ? 'hecho' : 'hechos'} hoy`,
            },
          ]
        : [],
  }
}
