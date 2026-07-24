import type { Tables } from '@/core/supabase'

/**
 * Tipos del dominio de entrenamiento.
 *
 * Las filas de la base de datos se usan tal cual las genera Supabase
 * (`snake_case`): son la fuente única de verdad y evitan una capa de mapeo que
 * habría que mantener en paralelo al esquema. Sobre ellas se definen los
 * agregados que la interfaz necesita (una sesión con sus series agrupadas).
 */

export type Exercise = Tables<'exercises'>
export type WorkoutSession = Tables<'workout_sessions'>
export type WorkoutSet = Tables<'workout_sets'>

/** Datos del ejercicio que acompañan a una serie (llegan por join). */
export type ExerciseRef = Pick<Exercise, 'id' | 'name' | 'muscle_group' | 'equipment'>

/** Serie registrada junto al ejercicio al que pertenece. */
export type WorkoutSetWithExercise = WorkoutSet & { readonly exercise: ExerciseRef }

/**
 * Ejercicio dentro de una sesión con sus series en orden.
 *
 * No existe tabla intermedia a propósito: un ejercicio forma parte de la sesión
 * porque tiene series registradas (ver docs/04-modelo-de-datos.md).
 */
export interface SessionExercise {
  readonly exercise: ExerciseRef
  readonly sets: readonly WorkoutSet[]
}

/** Cifras derivadas de una sesión. Siempre se calculan; nunca se almacenan. */
export interface SessionStats {
  readonly exerciseCount: number
  readonly setCount: number
  /** Volumen total (repeticiones × peso) de las series efectivas, en kg. */
  readonly totalVolumeKg: number
  /** Duración en minutos; `null` mientras la sesión sigue en curso. */
  readonly durationMinutes: number | null
}

/** Sesión con sus series agrupadas por ejercicio y su resumen. */
export interface SessionDetail {
  readonly session: WorkoutSession
  readonly exercises: readonly SessionExercise[]
  readonly stats: SessionStats
}

/** Datos necesarios para registrar una serie. */
export interface LogSetInput {
  readonly sessionId: string
  readonly exerciseId: string
  readonly reps: number
  readonly weightKg: number
}
