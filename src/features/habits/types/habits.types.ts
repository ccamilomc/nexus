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
}

export interface HabitDay {
  /** Fecha local en `YYYY-MM-DD`. */
  readonly dateKey: string
  readonly isDone: boolean
}
