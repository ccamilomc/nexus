import type { Tables } from '@/core/supabase'
import type { GoalProgress, SeriesPoint } from '@/shared/utils'

/**
 * Tipos del dominio de estudio.
 *
 * Como en el resto del proyecto, las filas se usan tal cual las genera Supabase
 * (`snake_case`) y encima se definen los agregados que necesita la interfaz.
 */

export type Subject = Tables<'subjects'>
export type StudySession = Tables<'study_sessions'>

/** Datos de la materia que acompañan a una sesión (llegan por join). */
export type SubjectRef = Pick<Subject, 'id' | 'name' | 'color'>

/** Sesión registrada junto a la materia a la que pertenece. */
export type StudySessionWithSubject = StudySession & { readonly subject: SubjectRef | null }

/** Lo estudiado en una materia dentro de un periodo. */
export interface SubjectTime {
  readonly subject: SubjectRef
  readonly minutes: number
}

/**
 * El estudio de un día: sus sesiones, el total y el reparto por materia.
 *
 * Los totales se **calculan** a partir de las sesiones; nunca se almacenan, para
 * que no puedan quedar desincronizados (ver docs/04-modelo-de-datos.md).
 */
export interface DayStudy {
  readonly sessions: readonly StudySessionWithSubject[]
  readonly totalMinutes: number
  /** Materias con tiempo, de más a menos estudiada. */
  readonly bySubject: readonly SubjectTime[]
}

/** Una materia en la semana: lo estudiado frente a lo que se propuso. */
export interface SubjectWeek {
  readonly subject: SubjectRef
  readonly minutes: number
  /** Objetivo semanal en minutos; `null` si la materia no se fijó ninguno. */
  readonly targetMinutes: number | null
  /** Avance hacia el objetivo; `null` cuando no hay objetivo que medir. */
  readonly progress: GoalProgress | null
}

/**
 * La semana de estudio: el total, el objetivo conjunto y el detalle por materia.
 *
 * Responde «¿voy bien?», que es la pregunta que el total de hoy no puede
 * contestar: una jornada floja no significa nada; cuatro seguidas, sí.
 */
export interface WeekStudy {
  readonly totalMinutes: number
  /** Suma de los objetivos fijados; `null` si ninguna materia tiene. */
  readonly targetMinutes: number | null
  readonly progress: GoalProgress | null
  readonly bySubject: readonly SubjectWeek[]
}

/**
 * El estudio de un periodo, tal y como lo consume Analytics.
 *
 * Un día sin sesión vale **cero**, no es un hueco (ver `buildStudySeries`).
 */
export interface StudyPeriodSeries {
  /** Minutos estudiados cada día del periodo. */
  readonly points: readonly SeriesPoint[]
  readonly totalMinutes: number
  readonly previousTotalMinutes: number
  /** Días con al menos una sesión. */
  readonly daysStudied: number
  readonly previousDaysStudied: number
  /** Media de los **días estudiados**; `null` si no hubo ninguno. */
  readonly averageMinutesPerStudiedDay: number | null
  readonly previousAverageMinutesPerStudiedDay: number | null
  /** La materia con más tiempo en el periodo; `null` si no se estudió nada. */
  readonly topSubject: { readonly name: string; readonly minutes: number } | null
}
