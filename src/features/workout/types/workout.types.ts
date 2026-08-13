import type { Tables } from '@/core/supabase'
import type { SeriesPoint } from '@/shared/utils'

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
export type Routine = Tables<'routines'>
export type RoutineDay = Tables<'routine_days'>
export type RoutineExercise = Tables<'routine_exercises'>

/** Lo mínimo de una sesión para situarla en el tiempo y medir su duración. */
export type SessionSample = Pick<WorkoutSession, 'id' | 'started_at' | 'ended_at'>

/** Lo mínimo de una serie para sumar volumen, con la sesión a la que pertenece. */
export type VolumeSetSample = Pick<
  WorkoutSet,
  'session_id' | 'reps' | 'weight' | 'is_warmup' | 'completed'
>

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

/**
 * Una serie con el día en que se hizo, para mirar la historia de un ejercicio.
 *
 * Sólo lo que se agrega: sin el nombre del ejercicio —ya se sabe cuál es— ni las
 * columnas que nadie suma.
 */
export interface ExerciseSetSample {
  readonly reps: number | null
  readonly weight: number | null
  readonly is_warmup: boolean
  readonly session: SessionSample
}

/** Una serie tal como se compara con la de otro día: sin adornos. */
export interface PerformedSet {
  readonly reps: number
  readonly weightKg: number
}

/**
 * Lo que se hizo la última vez en un ejercicio.
 *
 * Es la referencia con la que se decide el peso de hoy. Sale de la última sesión
 * **en la que apareció ese ejercicio**, que no tiene por qué ser la última
 * sesión: en una rutina por días, el press de banca no se toca desde hace tres.
 */
export interface LastPerformance {
  readonly exerciseId: string
  readonly performedAt: string
  /** Series de trabajo, en el orden en que se hicieron. Sin calentamiento. */
  readonly sets: readonly PerformedSet[]
  /** La más pesada de aquel día: lo que hay que superar. */
  readonly topSet: PerformedSet | null
}

/**
 * Lo mejor que se ha hecho en un ejercicio, y cómo se llegó ahí.
 *
 * **Sin estimar nada.** Hay fórmulas para calcular un «máximo teórico a una
 * repetición» a partir de una serie de ocho, y son eso: una fórmula. Aquí sólo
 * hay pesos que se levantaron de verdad, con su fecha, porque un récord que la
 * aplicación se inventó no es un récord.
 */
export interface ExerciseProgress {
  readonly exerciseId: string
  /** El peso más alto levantado, con las repeticiones y el día en que fue. */
  readonly heaviest: { readonly set: PerformedSet; readonly performedAt: string } | null
  /** La serie de más volumen (peso × repeticiones), que no siempre es la más pesada. */
  readonly bestVolume: { readonly set: PerformedSet; readonly performedAt: string } | null
  /** El mejor peso de cada entrenamiento, del más antiguo al más reciente. */
  readonly topWeightBySession: readonly {
    readonly performedAt: string
    readonly weightKg: number
  }[]
  /** Entrenamientos en los que aparece. */
  readonly sessionCount: number
  /** Series de trabajo acumuladas. */
  readonly setCount: number
}

/** Sesión con sus series agrupadas por ejercicio y su resumen. */
export interface SessionDetail {
  readonly session: WorkoutSession
  readonly exercises: readonly SessionExercise[]
  readonly stats: SessionStats
  /**
   * Día de rutina que originó la sesión, con sus ejercicios prescritos.
   *
   * Se lee del servidor (vía `routine_day_id`) en lugar de pasarse al navegar:
   * así el plan sigue ahí aunque se recargue la página a mitad del gimnasio.
   */
  readonly plan: RoutineDayDetail | null
}

/**
 * El entrenamiento de un periodo, tal y como lo consume Analytics.
 *
 * A diferencia del sueño, aquí **un día sin registro es un cero, no un hueco**:
 * un entrenamiento se apunta mientras se hace, así que no haberlo apuntado
 * significa no haber entrenado. El sueño se anota a posteriori y sí admite
 * olvidos, por eso allí el hueco se respeta.
 */
export interface WorkoutPeriodSeries {
  /** Volumen (kg) de cada día del periodo. */
  readonly volumePoints: readonly SeriesPoint[]
  readonly sessionCount: number
  readonly previousSessionCount: number
  readonly totalVolumeKg: number
  readonly previousTotalVolumeKg: number
  readonly setCount: number
  /** Días con al menos un entrenamiento. */
  readonly daysTrained: number
  /** Duración media **por entrenamiento**; `null` si no hubo ninguno. */
  readonly averageDurationMinutes: number | null
  readonly previousAverageDurationMinutes: number | null
}

/** Datos necesarios para registrar una serie. */
export interface LogSetInput {
  readonly sessionId: string
  readonly exerciseId: string
  readonly reps: number
  readonly weightKg: number
}

// ─── Rutinas ────────────────────────────────────────────────────────────────
// Una rutina es una plantilla: días lógicos (Push, Pull…) y, dentro de cada uno,
// ejercicios prescritos con sus objetivos. No es lo que se entrena, es lo que se
// planea entrenar (ver docs/04-modelo-de-datos.md).

/** Ejercicio prescrito junto a los datos del ejercicio (llegan por join). */
export type RoutineExerciseWithExercise = RoutineExercise & { readonly exercise: ExerciseRef }

/** Un día de la rutina con sus ejercicios prescritos en orden. */
export interface RoutineDayDetail {
  readonly day: RoutineDay
  readonly exercises: readonly RoutineExerciseWithExercise[]
}

/** Rutina con sus días y, dentro de cada día, sus ejercicios. */
export interface RoutineDetail {
  readonly routine: Routine
  readonly days: readonly RoutineDayDetail[]
}
