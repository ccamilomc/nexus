import type { ExerciseProgress, ExerciseSetSample, PerformedSet } from '../types/workout.types'

/** El día de un entrenamiento: cuando terminó, o cuando empezó si sigue abierto. */
function performedAt(session: ExerciseSetSample['session']): string {
  return session.ended_at ?? session.started_at
}

/**
 * Lo mejor que se ha hecho en un ejercicio, y cómo se llegó ahí.
 *
 * **Dos récords y no uno**, porque no siempre coinciden: la serie más pesada
 * responde «¿cuánto llegué a levantar?» y la de más volumen —peso por
 * repeticiones— responde «¿cuál fue mi mejor serie?». Un día de 100 kg × 1 y
 * otro de 80 kg × 8 son logros distintos y ninguno tapa al otro.
 *
 * El calentamiento no entra en nada de esto, igual que en «la última vez»: un
 * récord no se hace con la barra vacía.
 *
 * La progresión guarda **el mejor peso de cada entrenamiento**, no todas las
 * series: es la línea que enseña si se está subiendo, sin el ruido de las series
 * de bajada.
 */
export function buildExerciseProgress(
  exerciseId: string,
  samples: readonly ExerciseSetSample[],
): ExerciseProgress {
  let heaviest: { set: PerformedSet; performedAt: string } | null = null
  let bestVolume: { set: PerformedSet; performedAt: string } | null = null
  const topBySession = new Map<string, { performedAt: string; weightKg: number }>()
  let setCount = 0

  for (const sample of samples) {
    if (sample.is_warmup || sample.reps === null || sample.weight === null) continue

    const set: PerformedSet = { reps: sample.reps, weightKg: sample.weight }
    const day = performedAt(sample.session)
    setCount += 1

    // A igual peso gana la que llevó más repeticiones, que es la mejor marca.
    if (
      !heaviest ||
      set.weightKg > heaviest.set.weightKg ||
      (set.weightKg === heaviest.set.weightKg && set.reps > heaviest.set.reps)
    ) {
      heaviest = { set, performedAt: day }
    }

    if (!bestVolume || set.weightKg * set.reps > bestVolume.set.weightKg * bestVolume.set.reps) {
      bestVolume = { set, performedAt: day }
    }

    const current = topBySession.get(sample.session.id)
    if (!current || set.weightKg > current.weightKg) {
      topBySession.set(sample.session.id, { performedAt: day, weightKg: set.weightKg })
    }
  }

  const topWeightBySession = [...topBySession.values()].sort((a, b) =>
    a.performedAt.localeCompare(b.performedAt),
  )

  return {
    exerciseId,
    heaviest,
    bestVolume,
    topWeightBySession,
    sessionCount: topBySession.size,
    setCount,
  }
}
