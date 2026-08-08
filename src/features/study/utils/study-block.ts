const SECONDS_PER_MINUTE = 60

/** Las duraciones que se ofrecen, con su nombre. */
export const BLOCK_OPTIONS = [
  { minutes: 25, label: '25 min' },
  { minutes: 50, label: '50 min' },
  { minutes: 90, label: '90 min' },
] as const

/** Cómo va un bloque con duración propuesta. */
export interface BlockProgress {
  /** Segundos que faltan; cero cuando ya se cumplió. */
  readonly remainingSeconds: number
  /** Segundos de más, si se siguió estudiando después. */
  readonly overtimeSeconds: number
  readonly isDone: boolean
  /** De 0 a 100; se queda en 100 al cumplirse, no sigue subiendo. */
  readonly percent: number
}

/**
 * Cómo va el bloque: lo que queda, y lo que se pasó si siguió.
 *
 * **Cumplir el bloque no para el cronómetro.** Nexus propone una duración, no la
 * impone: quien está en mitad de un problema no quiere que le corten, y cerrar
 * la sesión sola apuntaría un rato de estudio que aún no terminó. Se avisa y se
 * sigue contando.
 *
 * Devuelve `null` sin objetivo, que es un bloque abierto de los de siempre.
 */
export function blockProgress(
  elapsedSeconds: number,
  targetMinutes: number | null,
): BlockProgress | null {
  if (targetMinutes === null || targetMinutes <= 0) return null

  const targetSeconds = targetMinutes * SECONDS_PER_MINUTE
  const remaining = targetSeconds - elapsedSeconds

  return {
    remainingSeconds: Math.max(remaining, 0),
    overtimeSeconds: Math.max(-remaining, 0),
    isDone: remaining <= 0,
    // Se recorta al 100: una barra que sigue creciendo deja de decir «vas por
    // aquí» y pasa a decir sólo «te pasaste», que ya se dice con palabras.
    percent: Math.min((elapsedSeconds / targetSeconds) * 100, 100),
  }
}
