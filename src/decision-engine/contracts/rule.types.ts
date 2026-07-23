import type { DailyContext } from './context.types'
import type { Recommendation } from './recommendation.types'

/**
 * Una regla es una función pura con una única responsabilidad.
 * Se versiona en su `id` (p. ej. `meal-swap@1`): cambiar el comportamiento
 * significa crear una versión nueva, no editar la existente en silencio.
 */
export interface Rule {
  readonly id: string
  appliesTo(context: DailyContext): boolean
  evaluate(context: DailyContext): readonly Recommendation[]
}
