import { useNow, useToday } from '@/core/time'
import type { DailyContext, Recommendation } from '@/decision-engine'
import { evaluate } from '@/decision-engine'
import { useHabitsContext } from '@/features/habits'
import { useNutritionContext } from '@/features/nutrition'
import { useSleepContext } from '@/features/sleep'
import { useStudyContext } from '@/features/study'
import { useWorkoutContext } from '@/features/workout'
import { toDateKey } from '@/shared/utils'

import { hasNothingSetUp } from '../utils/blank-slate'
import { useDismissedKeys } from './use-dismissed'
import { useTodayPlan } from './use-today-plan'

export interface DailyPlan {
  readonly isPending: boolean
  /** Qué hacer hoy, de lo más urgente a lo menos. */
  readonly recommendations: readonly Recommendation[]
  /** El día está al día: no hay nada pendiente. */
  readonly isClear: boolean
  /**
   * No hay nada pendiente **porque la cuenta aún no tiene nada puesto en
   * marcha**, no porque se vaya al día. Ver `utils/blank-slate.ts`.
   */
  readonly isBlank: boolean
}

/**
 * El plan del día: reúne el contexto de cada dominio y lo pasa por el motor.
 *
 * Cada feature aporta **su parte** a través de su barrel, y el motor no conoce a
 * ninguna: recibe un `DailyContext` y devuelve recomendaciones (ver
 * docs/06-decision-engine-e-ia.md).
 *
 * Mientras algún dominio esté cargando **no se evalúa nada**: con los datos a
 * medias saldrían avisos falsos —«te falta toda el agua»— que desaparecerían un
 * segundo después.
 */
export function useDailyPlan(): DailyPlan {
  const today = useToday()
  // Se refresca cada hora en punto, así que el plan cambia solo al caer la
  // tarde en vez de quedarse con el consejo de la mañana.
  const now = useNow()
  const nutrition = useNutritionContext()
  const habits = useHabitsContext()
  const study = useStudyContext()
  const workout = useWorkoutContext()
  const sleep = useSleepContext()
  const dismissed = useDismissedKeys(today)
  const plan = useTodayPlan(today)

  const isPending =
    nutrition.isPending ||
    habits.isPending ||
    study.isPending ||
    workout.isPending ||
    sleep.isPending ||
    dismissed.isPending ||
    plan.isPending

  // Todos los hooks quedan por encima de esta salida: si alguno viviera debajo,
  // React vería un número distinto de hooks entre renders.
  if (isPending) return { isPending: true, recommendations: [], isClear: false, isBlank: false }

  const context: DailyContext = {
    date: toDateKey(today),
    // El motor no lee el reloj: se le pasa el instante para que sea determinista.
    now: now.toISOString(),
    goals: {
      ...(nutrition.goal === undefined ? {} : { nutrition: nutrition.goal }),
      ...(sleep.targetMinutes === undefined ? {} : { sleepMinutes: sleep.targetMinutes }),
      ...(study.weeklyTargetMinutes === undefined
        ? {}
        : { studyWeeklyMinutes: study.weeklyTargetMinutes }),
    },
    plan: (plan.data?.items ?? []).map((item) => ({
      id: item.id,
      domain: item.domain,
      status: item.status,
      priority: item.priority,
      ...(item.scheduled_start === null ? {} : { scheduledStart: item.scheduled_start }),
      ...(item.scheduled_end === null ? {} : { scheduledEnd: item.scheduled_end }),
    })),
    workout: workout.workout,
    nutrition: nutrition.nutrition,
    study: study.study,
    habits: habits.habits,
    sleep: sleep.sleep,
  }

  // Lo descartado se filtra **después** de evaluar, no antes: el motor sigue
  // siendo puro y ajeno a lo que el usuario haya decidido esconder.
  const discarded = new Set(dismissed.data ?? [])
  const recommendations = evaluate(context).filter(({ key }) => !discarded.has(key))

  return {
    isPending: false,
    recommendations,
    isClear: recommendations.length === 0,
    isBlank: hasNothingSetUp(context),
  }
}
