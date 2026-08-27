import type { LastPerformance, SessionSample, WorkoutSetWithExercise } from '../types/workout.types'

/**
 * Qué se hizo la última vez en cada ejercicio.
 *
 * **Es la pregunta que se hace uno frente a la máquina**: «¿cuánto puse la
 * semana pasada?». Sin ella se entrena a ciegas y se repite el mismo peso
 * durante meses sin darse cuenta.
 *
 * Se busca **la última sesión en la que se tocó ese ejercicio**, no la última
 * sesión a secas: en una rutina de empuje/tirón/pierna, el press de banca no
 * sale desde hace tres entrenamientos y sigue siendo lo último que se hizo.
 *
 * El calentamiento no cuenta. La referencia para superarse son las series de
 * trabajo, y meter una barra vacía entre ellas daría un peso que no dice nada.
 */
export function buildLastPerformances(
  sessions: readonly SessionSample[],
  sets: readonly WorkoutSetWithExercise[],
): LastPerformance[] {
  // Las sesiones llegan de la más reciente a la más antigua; el orden manda,
  // porque la primera en la que aparezca un ejercicio es su «última vez».
  const orderBySession = new Map(sessions.map(({ id }, index) => [id, index]))

  const bestByExercise = new Map<string, { order: number; session: SessionSample }>()
  const setsByKey = new Map<string, { reps: number; weightKg: number }[]>()

  for (const set of sets) {
    if (set.is_warmup || set.reps === null || set.weight === null) continue

    const order = orderBySession.get(set.session_id)
    if (order === undefined) continue

    const key = `${set.exercise.id}|${set.session_id}`
    const list = setsByKey.get(key)
    if (list) list.push({ reps: set.reps, weightKg: set.weight })
    else setsByKey.set(key, [{ reps: set.reps, weightKg: set.weight }])

    const current = bestByExercise.get(set.exercise.id)
    if (!current || order < current.order) {
      const session = sessions[order]
      if (session) bestByExercise.set(set.exercise.id, { order, session })
    }
  }

  const performances: LastPerformance[] = []

  for (const [exerciseId, { session }] of bestByExercise) {
    const performed = setsByKey.get(`${exerciseId}|${session.id}`) ?? []
    if (performed.length === 0) continue

    // La serie más pesada es la referencia para superarse; a igual peso, la de
    // más repeticiones, que es lo que de verdad se mejoró ese día.
    let topSet = performed[0] ?? null
    for (const set of performed) {
      if (!topSet) continue
      if (set.weightKg > topSet.weightKg) topSet = set
      else if (set.weightKg === topSet.weightKg && set.reps > topSet.reps) topSet = set
    }

    performances.push({
      exerciseId,
      performedAt: session.ended_at ?? session.started_at,
      sets: performed,
      topSet,
    })
  }

  return performances
}
