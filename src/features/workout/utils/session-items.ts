import type {
  Exercise,
  ExerciseRef,
  RoutineDayDetail,
  RoutineExercise,
  SessionExercise,
  WorkoutSet,
} from '../types/workout.types'

/** Un ejercicio tal y como se muestra en el entrenamiento en curso. */
export interface SessionItem {
  readonly exercise: ExerciseRef
  readonly sets: readonly WorkoutSet[]
  /** Prescripción de la rutina, si el ejercicio viene del plan del día. */
  readonly prescribed: RoutineExercise | null
  /** Sólo lo añadido a mano y aún sin series se puede quitar de la pantalla. */
  readonly canRemove: boolean
}

/**
 * Compone lo que se ve durante el entrenamiento, en este orden:
 *
 * 1. lo ya registrado (en el orden en que se entrenó),
 * 2. lo que la rutina prescribe y aún no se ha hecho (en el orden de la rutina),
 * 3. lo añadido a mano en esta pantalla.
 *
 * Los ejercicios prescritos no se pueden quitar: son el plan. Si no se registra
 * ninguna serie, simplemente no forman parte del entrenamiento (un ejercicio
 * existe en la sesión porque tiene series, ver docs/04-modelo-de-datos.md).
 */
export function buildSessionItems(
  logged: readonly SessionExercise[],
  plan: RoutineDayDetail | null,
  drafts: readonly Exercise[],
): readonly SessionItem[] {
  const prescribedByExercise = new Map<string, RoutineExercise>()
  for (const routineExercise of plan?.exercises ?? []) {
    prescribedByExercise.set(routineExercise.exercise.id, routineExercise)
  }

  const placed = new Set<string>()
  const items: SessionItem[] = []

  for (const { exercise, sets } of logged) {
    placed.add(exercise.id)
    items.push({
      exercise,
      sets,
      prescribed: prescribedByExercise.get(exercise.id) ?? null,
      canRemove: false,
    })
  }

  for (const routineExercise of plan?.exercises ?? []) {
    if (placed.has(routineExercise.exercise.id)) continue
    placed.add(routineExercise.exercise.id)
    items.push({
      exercise: routineExercise.exercise,
      sets: [],
      prescribed: routineExercise,
      canRemove: false,
    })
  }

  for (const draft of drafts) {
    if (placed.has(draft.id)) continue
    placed.add(draft.id)
    items.push({ exercise: draft, sets: [], prescribed: null, canRemove: true })
  }

  return items
}
