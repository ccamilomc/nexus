import type { PlanItemDomain, Priority } from './context.types'

/**
 * Contrato de SALIDA del Decision Engine.
 * El motor sólo **sugiere**: nunca ejecuta ni persiste nada.
 */

export type RecommendationType =
  'day_recalculation' | 'meal_swap' | 'alternative_routine' | 'alert' | 'insight'

export interface Recommendation {
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
