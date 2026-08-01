import type { PlanItemDomain, Priority } from './context.types'

/**
 * Contrato de SALIDA del Decision Engine.
 * El motor sólo **sugiere**: nunca ejecuta ni persiste nada.
 */

export type RecommendationType =
  'day_recalculation' | 'meal_swap' | 'alternative_routine' | 'alert' | 'insight'

export interface Recommendation {
  /**
   * Identidad estable de la sugerencia entre evaluaciones.
   *
   * El motor se ejecuta cada vez que se abre el plan, así que la misma
   * recomendación nace una y otra vez. Sin una clave que la reconozca no se
   * puede recordar que el usuario ya la descartó, y una sugerencia que vuelve
   * después de haberla rechazado deja de ser un consejo.
   *
   * Lleva la versión de la regla (`meal-swap@1`) y, cuando la regla puede
   * hablar de cosas distintas, de qué habla (`meal-swap@1:<idDelAlimento>`).
   * Cambiar la versión de una regla invalida sus descartes, que es lo correcto:
   * si el criterio cambió, merece una segunda oportunidad.
   */
  readonly key: string
  readonly type: RecommendationType
  readonly domain?: PlanItemDomain
  readonly priority: Priority
  /** Titular corto y humano. */
  readonly title: string
  /** Qué se sugiere hacer. */
  readonly message: string
  /** Por qué se sugiere. Obligatorio: la transparencia es un requisito de producto. */
  readonly reason: string
  /** Carga accionable (ítems reprogramados, sustituciones…). */
  readonly data: Readonly<Record<string, unknown>>
  /** ISO 8601 */
  readonly validUntil?: string
}
