import { useToday } from '@/core/time'
import type { DailyContext, Recommendation } from '@/decision-engine'
import { evaluate } from '@/decision-engine'
import { useHabitsContext } from '@/features/habits'
import { useNutritionContext } from '@/features/nutrition'
import { useStudyContext } from '@/features/study'
import { useWorkoutContext } from '@/features/workout'

export interface DailyPlan {
  readonly isPending: boolean
  /** Qué hacer hoy, de lo más urgente a lo menos. */
  readonly recommendations: readonly Recommendation[]
  /** El día está al día: no hay nada pendiente. */
  readonly isClear: boolean
}

/** Clave de día local (`YYYY-MM-DD`). */
function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
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
  const nutrition = useNutritionContext()
  const habits = useHabitsContext()
  const study = useStudyContext()
  const workout = useWorkoutContext()

  const isPending = nutrition.isPending || habits.isPending || study.isPending || workout.isPending

  if (isPending) return { isPending: true, recommendations: [], isClear: false }

  const context: DailyContext = {
    date: toDateKey(today),
    // El motor no lee el reloj: se le pasa el instante para que sea determinista.
    now: new Date().toISOString(),
    profile: { sex: 'unspecified' },
    goals: {
      ...(nutrition.goal === undefined ? {} : { nutrition: nutrition.goal }),
      ...(study.weeklyTargetMinutes === undefined
        ? {}
        : { studyWeeklyMinutes: study.weeklyTargetMinutes }),
    },
    plan: [],
    workout: workout.workout,
    nutrition: nutrition.nutrition,
    study: study.study,
    habits: habits.habits,
    sleep: {},
    constraints: {},
  }

  const recommendations = evaluate(context)

  return { isPending: false, recommendations, isClear: recommendations.length === 0 }
}
