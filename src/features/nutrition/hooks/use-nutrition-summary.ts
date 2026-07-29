import { useMemo } from 'react'

import { formatCalories, formatVolumeMl } from '../utils/format'
import { useActiveGoal, useDayNutrition, useDayWater } from './use-nutrition'

/**
 * Resumen de nutrición para otras pantallas (hoy, el dashboard).
 *
 * Devuelve frases ya formadas, no datos crudos: así el módulo decide **cómo se
 * cuenta lo suyo** y quien lo muestra sólo lo coloca. Es el contrato que evita
 * que el dashboard tenga que conocer macros, metas ni unidades.
 */
export interface NutritionSummary {
  readonly isPending: boolean
  /** No hay nada registrado hoy. */
  readonly isEmpty: boolean
  /** Frases cortas, listas para mostrar. */
  readonly lines: readonly string[]
}

/** Con objetivo se dice el avance; sin él, sólo la cifra. */
function describe(consumed: string, target: string | null): string {
  return target === null ? consumed : `${consumed} de ${target}`
}

export function useNutritionSummary(): NutritionSummary {
  const today = useMemo(() => new Date(), [])
  const day = useDayNutrition(today)
  const water = useDayWater(today)
  const goal = useActiveGoal()

  const isPending = day.isPending || water.isPending
  const calories = day.data?.totals.calories ?? 0
  const waterMl = water.data?.totalMl ?? 0

  const lines = [
    describe(
      formatCalories(calories),
      goal.data ? formatCalories(goal.data.calories_target) : null,
    ),
    describe(formatVolumeMl(waterMl), goal.data ? formatVolumeMl(goal.data.water_ml_target) : null),
  ]

  return {
    isPending,
    isEmpty: !isPending && calories === 0 && waterMl === 0,
    lines,
  }
}
