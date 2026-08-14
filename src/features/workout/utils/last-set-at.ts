import type { SessionExercise } from '../types/workout.types'

/**
 * Cuándo se registró la última serie de la sesión, sea del ejercicio que sea.
 *
 * **Una sola cifra para toda la sesión, no una por ejercicio.** Lo que uno mira
 * entre series es «cuánto llevo parado», y eso no cambia por pasar de la banca a
 * las dominadas: el descanso corre igual.
 *
 * Se usa `created_at` —cuándo se apuntó— y no un campo de la serie: es lo más
 * cerca que hay del momento en que se terminó de levantar.
 */
export function findLastSetAt(exercises: readonly SessionExercise[]): string | null {
  let latest: string | null = null

  for (const { sets } of exercises) {
    for (const set of sets) {
      if (!latest || set.created_at > latest) latest = set.created_at
    }
  }

  return latest
}
