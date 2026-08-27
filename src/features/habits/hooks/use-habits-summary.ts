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

  const todos = data ?? []
  // El recuento del día sólo mira **los de hoy**: con un hábito de lunes,
  // miércoles y viernes, decir «0 de 3» un martes es contar como pendiente algo
  // que no tocaba. **La racha, en cambio, sale de todos**: la de ese hábito
  // sigue viva el martes aunque el martes no toque.
  const deHoy = todos.filter((entry) => entry.appliesToday)
  const doneCount = deHoy.filter((entry) => entry.isDoneToday).length
  const bestStreak = todos.reduce((best, entry) => Math.max(best, entry.streak), 0)

  return {
    isPending,
    // Vacío es **no tener hábitos**, no que hoy no toque ninguno: a quien tiene
    // tres para el fin de semana no se le dice un martes que no tiene ninguno.
    isEmpty: !isPending && todos.length === 0,
    // La racha sólo se menciona cuando existe: sin ella no se recrimina nada.
    lines:
      bestStreak > 0 ? [`Mejor racha: ${bestStreak === 1 ? '1 día' : `${bestStreak} días`}`] : [],
    progress:
      deHoy.length > 0
        ? [
            {
              // «Hoy» y no «Hábitos»: la etiqueta va dentro de la tarjeta de
              // hábitos, y repetir el nombre sólo hace tartamudear la pantalla.
              label: 'Hoy',
              value: doneCount,
              target: deHoy.length,
              display: `${doneCount} de ${deHoy.length} ${deHoy.length === 1 ? 'hecho' : 'hechos'} hoy`,
            },
          ]
        : [],
  }
}
