import type { Enums, Tables } from '@/core/supabase'

/** Tipos del dominio de hábitos. Las filas se usan tal cual las da Supabase. */

export type Habit = Tables<'habits'>
export type HabitLog = Tables<'habit_logs'>
export type HabitFrequency = Enums<'habit_frequency'>

/**
 * Un hábito con lo que la pantalla necesita saber hoy.
 *
 * `streak` se **calcula** a partir de los registros; nunca se almacena, para
 * que no pueda quedar desincronizada (ver docs/04-modelo-de-datos.md).
 */
export interface HabitToday {
  readonly habit: Habit
  readonly isDoneToday: boolean
  readonly streak: number
  /** Últimos días, del más antiguo al más reciente, para el mini-calendario. */
  readonly recentDays: readonly HabitDay[]
  /** Cumplimiento en las últimas semanas, para ver la tendencia. */
  readonly consistency: HabitConsistency
}

export interface HabitDay {
  /** Fecha local en `YYYY-MM-DD`. */
  readonly dateKey: string
  readonly isDone: boolean
  /**
   * Si se puede marcar o desmarcar.
   *
   * Es `false` en los días **anteriores a la creación del hábito**: ahí no
   * existía, y marcarlos sumaría a la racha días que la constancia no cuenta.
   */
  readonly isEditable: boolean
}

/**
 * Constancia de un hábito en una ventana de días.
 *
 * `totalDays` puede ser menor que la ventana pedida: nunca cuenta días
 * anteriores a la creación del hábito.
 */
export interface HabitConsistency {
  readonly doneDays: number
  readonly totalDays: number
  readonly percent: number
}
