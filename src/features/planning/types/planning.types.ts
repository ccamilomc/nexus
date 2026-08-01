import type { Json, Tables } from '@/core/supabase'

/**
 * Tipos del plan del día.
 *
 * El plan no guarda las recomendaciones que muestra: se recalculan al vuelo en
 * cada visita porque dependen de lo registrado hasta ese momento. Lo único que
 * se persiste es lo que el usuario **decidió**, que es lo que el motor no puede
 * volver a deducir.
 */

/** Fila mínima de un descarte: sólo hace falta su carga para leer la clave. */
export interface DismissedRow {
  readonly id: string
  readonly data: Json
}

export type DailyPlanRow = Tables<'daily_plans'>
export type PlanItem = Tables<'plan_items'>

/**
 * El plan de hoy: la agenda que el usuario se ha puesto.
 *
 * Convive con las recomendaciones sin confundirse con ellas: **esto lo decidió
 * el usuario**, aquéllas las propone el motor. Por eso el plan se guarda y las
 * recomendaciones no.
 */
export interface TodayPlan {
  readonly id: string
  /** De la más temprana a la más tardía; las que no tienen hora, al final. */
  readonly items: readonly PlanItem[]
}
