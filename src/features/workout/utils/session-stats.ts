import type {
  SessionExercise,
  SessionStats,
  WorkoutSession,
  WorkoutSet,
  WorkoutSetWithExercise,
} from '../types/workout.types'

/** Milisegundos de un minuto. */
const MS_PER_MINUTE = 60_000

/**
 * Agrupa las series por ejercicio conservando el orden en que aparecieron.
 *
 * Ese orden es el del entrenamiento real: el ejercicio se coloca donde el
 * usuario registró su primera serie.
 */
export function groupSetsByExercise(
  sets: readonly WorkoutSetWithExercise[],
): readonly SessionExercise[] {
  const byExercise = new Map<
    string,
    { exercise: WorkoutSetWithExercise['exercise']; sets: WorkoutSet[] }
  >()

  for (const { exercise, ...set } of sets) {
    const group = byExercise.get(exercise.id)
    if (group) {
      group.sets.push(set)
    } else {
      byExercise.set(exercise.id, { exercise, sets: [set] })
    }
  }

  return [...byExercise.values()]
}

/**
 * Volumen de una serie: repeticiones × peso.
 *
 * Las series de calentamiento y las no completadas no suman: no representan
 * trabajo efectivo y distorsionarían la comparación entre entrenamientos.
 */
function setVolume(set: WorkoutSet): number {
  if (set.is_warmup || !set.completed) return 0
  return (set.reps ?? 0) * (set.weight ?? 0)
}

/** Resumen calculado de una sesión: ejercicios, series, volumen y duración. */
export function calculateSessionStats(
  session: Pick<WorkoutSession, 'started_at' | 'ended_at'>,
  exercises: readonly SessionExercise[],
): SessionStats {
  let setCount = 0
  let volume = 0

  for (const { sets } of exercises) {
    setCount += sets.length
    for (const set of sets) volume += setVolume(set)
  }

  return {
    exerciseCount: exercises.length,
    setCount,
    // Redondeo a dos decimales para evitar el ruido de la coma flotante.
    totalVolumeKg: Math.round(volume * 100) / 100,
    durationMinutes: calculateDurationMinutes(session),
  }
}

/** Duración en minutos entre el inicio y el fin; `null` si sigue en curso. */
function calculateDurationMinutes({
  started_at,
  ended_at,
}: Pick<WorkoutSession, 'started_at' | 'ended_at'>): number | null {
  if (!ended_at) return null

  const elapsed = new Date(ended_at).getTime() - new Date(started_at).getTime()
  if (!Number.isFinite(elapsed) || elapsed < 0) return null

  return Math.round(elapsed / MS_PER_MINUTE)
}
