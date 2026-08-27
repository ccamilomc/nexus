import { useToday } from '@/core/time'
import { toDateKey } from '@/shared/utils'

import { type PendingToday, pendingToday } from '../utils/pending-today'
import { useHabitsToday, useToggleHabit } from './use-habits'

/**
 * Cuántos pendientes se ofrecen sin salir del panel.
 *
 * Tres caben sin que la tarjeta crezca más que sus vecinas. Con más, la lista
 * se corta y el resto queda a un toque en su pantalla.
 */
const MAX_SHOWN = 3

export interface QuickHabits extends PendingToday {
  readonly mark: (habitId: string) => void
  readonly errorMessage: string | null
}

/**
 * Marcar los hábitos del día sin salir del panel.
 *
 * El panel ya decía «Te quedan 3 hábitos, márcalos para cerrar el día completo»
 * y **no dejaba marcarlos**: había que abrir la pantalla de hábitos para hacer
 * lo que el propio aviso pedía.
 *
 * Se gana el sitio por el mismo criterio que el agua (ver `WaterQuickAdd`): es
 * de un toque y **registra de verdad**, no lleva a otra pantalla a registrar. Y
 * como el agua, aguanta quedarse sin red (ADR-0011).
 */
export function useQuickHabits(): QuickHabits {
  const today = useToday()
  const { data } = useHabitsToday(today)
  const todayKey = toDateKey(today)
  const toggle = useToggleHabit(todayKey)

  return {
    ...pendingToday(data ?? [], MAX_SHOWN),
    // `isDone: false` siempre: aquí sólo se marcan los que faltan. Desmarcar es
    // una corrección, y ésa se hace en su pantalla, donde se ve el historial.
    mark: (habitId) => toggle.mutate({ habitId, dateKey: todayKey, isDone: false }),
    errorMessage: toggle.error?.message ?? null,
  }
}
