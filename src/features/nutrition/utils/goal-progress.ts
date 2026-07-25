import type { GoalProgress } from '../types/nutrition.types'

/**
 * Avance hacia un objetivo.
 *
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
