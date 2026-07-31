/**
 * Avance hacia un objetivo, sea de calorías, de pesos o de horas de estudio.
 *
 * `percent` se limita a 100 para la barra (una barra no puede pasarse), pero
 * `consumed` y `remaining` son reales: pasarse de un objetivo es un dato, no un
 * error que haya que ocultar.
 */
export interface GoalProgress {
  readonly consumed: number
  readonly target: number
  readonly percent: number
  /** Lo que falta; `0` si ya se alcanzó o se pasó. */
  readonly remaining: number
  readonly isExceeded: boolean
}

/**
 * Sin objetivo (o con uno de cero) no hay nada que medir: se devuelve `null`
 * en lugar de inventar un 0 % o dividir por cero.
 */
export function calculateProgress(consumed: number, target: number): GoalProgress | null {
  if (target <= 0) return null

  const percent = Math.min(100, Math.round((consumed / target) * 100))

  return {
    consumed,
    target,
    percent,
    remaining: Math.max(0, Math.round((target - consumed) * 100) / 100),
    isExceeded: consumed > target,
  }
}
