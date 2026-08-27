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
 *
 * **Dentro de cada ejercicio manda `set_number`, no la hora de llegada.** Las
 * series se piden ordenadas por `created_at`, que lo pone la base al insertar, y
 * eso sólo coincide con el orden real mientras se registran de una en una con
 * red. Las que esperaron sin conexión salen casi a la vez al recuperarla y
 * pueden llegar en cualquier orden: tres series apuntadas 10, 9 y 8 aparecían
 * como 8, 9 y 10.
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

  return [...byExercise.values()].map((group) => ({
    ...group,
    sets: [...group.sets].sort((a, b) => a.set_number - b.set_number),
  }))
}

/** Lo que hace falta de una serie para saber cuánto trabajo representa. */
export type VolumeSet = Pick<WorkoutSet, 'reps' | 'weight' | 'is_warmup' | 'completed'>

/**
 * Volumen de una serie: repeticiones × peso.
 *
 * Las series de calentamiento y las no completadas no suman: no representan
 * trabajo efectivo y distorsionarían la comparación entre entrenamientos.
 */
function setVolume(set: VolumeSet): number {
  if (set.is_warmup || !set.completed) return 0
  return (set.reps ?? 0) * (set.weight ?? 0)
}

/**
 * Volumen total de un conjunto de series, en kg.
 *
 * Es **la** definición de volumen del proyecto: la usan tanto el resumen de una
 * sesión como las series de Analytics. Si algún día cambia qué cuenta como
 * trabajo efectivo, cambia aquí y en ningún otro sitio.
 */
export function sumVolume(sets: readonly VolumeSet[]): number {
  const total = sets.reduce((volume, set) => volume + setVolume(set), 0)

  // Redondeo a dos decimales para evitar el ruido de la coma flotante.
  return Math.round(total * 100) / 100
}

/** Resumen calculado de una sesión: ejercicios, series, volumen y duración. */
export function calculateSessionStats(
  session: Pick<WorkoutSession, 'started_at' | 'ended_at'>,
  exercises: readonly SessionExercise[],
): SessionStats {
  const allSets = exercises.flatMap(({ sets }) => sets)

  return {
    exerciseCount: exercises.length,
    setCount: allSets.length,
    totalVolumeKg: sumVolume(allSets),
    durationMinutes: sessionDurationMinutes(session),
  }
}

/** Duración en minutos entre el inicio y el fin; `null` si sigue en curso. */
export function sessionDurationMinutes({
  started_at,
  ended_at,
}: Pick<WorkoutSession, 'started_at' | 'ended_at'>): number | null {
  if (!ended_at) return null

  const elapsed = new Date(ended_at).getTime() - new Date(started_at).getTime()
  if (!Number.isFinite(elapsed) || elapsed < 0) return null

  return Math.round(elapsed / MS_PER_MINUTE)
}
