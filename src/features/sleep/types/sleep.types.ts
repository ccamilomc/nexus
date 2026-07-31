import type { Tables } from '@/core/supabase'

/**
 * Tipos del dominio de sueño.
 *
 * Como en el resto del proyecto, las filas se usan tal cual las genera Supabase
 * y encima se definen los agregados que necesita la interfaz.
 */

export type SleepLog = Tables<'sleep_logs'>
export type SleepGoal = Tables<'sleep_goals'>

/**
 * Las últimas noches, con su media.
 *
 * La media se **calcula** a partir de los registros; nunca se almacena (ver
 * docs/04-modelo-de-datos.md).
 */
export interface SleepHistory {
  readonly logs: readonly SleepLog[]
  /** Media de minutos dormidos; `null` si aún no hay ninguna noche. */
  readonly averageMinutes: number | null
  /** Media de la calidad (1-5); `null` si no se ha valorado ninguna. */
  readonly averageQuality: number | null
}
