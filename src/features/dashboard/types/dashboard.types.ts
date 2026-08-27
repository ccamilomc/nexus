import type { DayRange } from '@/shared/utils'

/** Tipos de Analytics: el periodo que se mira y cómo se compara con el anterior. */

export type AnalyticsPeriodId = '7d' | '30d' | '90d'

export interface AnalyticsPeriod {
  readonly id: AnalyticsPeriodId
  /** Etiqueta del selector. */
  readonly label: string
  /** Texto para acompañar a las cifras («en los últimos 30 días»). */
  readonly description: string
  readonly days: number
}

/**
 * El periodo resuelto en fechas concretas, listo para consultar y para dibujar.
 *
 * Lleva el periodo anterior del **mismo tamaño** porque toda cifra de Analytics
 * se muestra junto a con qué se compara: un número suelto no dice si vas mejor.
 */
export interface PeriodWindow {
  readonly period: AnalyticsPeriod
  /** Cuantos periodos hacia atras se esta mirando; 0 es el que acaba hoy. */
  readonly offset: number
  /**
   * Como se llama este tramo en las frases: «en los ultimos 30 dias» cuando
   * acaba hoy, y las fechas concretas en cuanto se retrocede.
   */
  readonly description: string
  /** Los días del periodo, del más antiguo al más reciente. */
  readonly days: readonly Date[]
  /** Rango del periodo actual, para acotar las consultas. */
  readonly range: DayRange
  /** El tramo inmediatamente anterior, del mismo tamaño. */
  readonly previousDays: readonly Date[]
  readonly previousRange: DayRange
}

/**
 * Cómo cambió una cifra respecto al periodo anterior.
 *
 * Es `null` siempre que la comparación no se sostenga (ver `compareValues`):
 * antes que insinuar una tendencia inventada, Analytics calla.
 */
export interface Comparison {
  readonly direction: 'up' | 'down' | 'flat'
  /**
   * Variación relativa, en porcentaje y en valor absoluto.
   *
   * `null` cuando el cambio es tan grande que la cifra estorba: se dice con
   * palabras, igual que cuando el periodo anterior estaba en cero.
   */
  readonly percent: number | null
}
