import type { Tables } from '@/core/supabase'

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
