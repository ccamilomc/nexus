import type { Enums, Tables } from '@/core/supabase'
import type { SeriesPoint } from '@/shared/utils'

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
  /** Si hoy es uno de los días de este hábito. Sin días marcados, siempre. */
  readonly appliesToday: boolean
  readonly streak: number
  /**
   * Días desde la última vez que se cumplió; `0` si fue hoy.
   *
   * `null` cuando no consta ninguna vez en la ventana que se trae, o cuando el
   * hábito es más nuevo que ella: uno recién creado todavía no se ha dejado de
   * hacer, y dar una cifra ahí sería inventarse un pasado.
   */
  readonly daysSinceDone: number | null
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
   * Si es el día de hoy.
   *
   * El mini-calendario está para corregir días pasados, y sin saber cuál es hoy
   * hay que contar cuadritos: siete letras seguidas no dicen dónde estás.
   */
  readonly isToday: boolean
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

/**
 * Los hábitos de un periodo, tal y como los consume Analytics.
 *
 * Se mide en **porcentaje cumplido**, no en cuenta absoluta: proponerse más
 * hábitos no puede parecer un empeoramiento (ver `buildHabitsSeries`).
 */
export interface HabitsPeriodSeries {
  /** Porcentaje cumplido cada día; hueco si ese día no había hábitos vigentes. */
  readonly points: readonly SeriesPoint[]
  /** Cumplimiento del periodo entero; `null` si no había ningún hábito. */
  readonly completionPercent: number | null
  readonly previousCompletionPercent: number | null
  /** Días en los que se cumplió todo lo que tocaba. */
  readonly perfectDays: number
  readonly previousPerfectDays: number
  /**
   * El habito con menos cumplimiento del periodo; `null` con menos de dos.
   *
   * La constancia global no dice si el 63 % son tres a medias o dos perfectos y
   * uno abandonado, y lo que se hace con esa informacion es distinto.
   */
  readonly hardest: { readonly name: string; readonly percent: number } | null
  /** La racha mas larga del periodo, o `null` si no hubo ninguna. */
  readonly bestStreak: StreakRun | null
}

/** Una racha: cuantos dias seguidos y entre que fechas. */
export interface StreakRun {
  readonly days: number
  /** Clave `YYYY-MM-DD` del primer dia. */
  readonly from: string
  /** Clave `YYYY-MM-DD` del ultimo. */
  readonly to: string
}
