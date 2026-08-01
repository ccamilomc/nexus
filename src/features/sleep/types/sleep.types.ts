import type { Tables } from '@/core/supabase'
import type { SeriesPoint } from '@/shared/utils'

/**
 * Tipos del dominio de sueño.
 *
 * Como en el resto del proyecto, las filas se usan tal cual las genera Supabase
 * y encima se definen los agregados que necesita la interfaz.
 */

export type SleepLog = Tables<'sleep_logs'>
export type SleepGoal = Tables<'sleep_goals'>

/** Lo mínimo de una noche para dibujarla en una serie. */
export type SleepDaySample = Pick<SleepLog, 'date' | 'duration_minutes' | 'quality_rating'>

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

/**
 * El sueño de un periodo, tal y como lo consume Analytics.
 *
 * Lo que aporta el dominio son **datos**: cuántos minutos cada noche y las
 * medias. Cómo se dibujan y con qué palabras se cuentan es cosa de Analytics.
 */
export interface SleepPeriodSeries {
  /** Minutos dormidos cada noche; hueco donde no hubo registro. */
  readonly points: readonly SeriesPoint[]
  /** Noches con registro dentro del periodo. */
  readonly nightsLogged: number
  /** Media de minutos de las noches registradas. */
  readonly averageMinutes: number | null
  /** Media de calidad (1-5) de las noches valoradas. */
  readonly averageQuality: number | null
  /** La misma media en el tramo anterior, para comparar. */
  readonly previousAverageMinutes: number | null
}
