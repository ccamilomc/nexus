import { createAppError, isForeignKeyViolation, toAppError } from '@/core/error'
import type { RoutineDaySnapshot } from '@/decision-engine'
import type { DayRange } from '@/shared/utils'

import { workoutRepository } from '../repositories/workout.repository'
import type {
  CreateExerciseValues,
  CreateRoutineValues,
  RoutineExerciseTargetsValues,
} from '../schemas/workout.schema'
import type {
  Exercise,
  LogSetInput,
  Routine,
  RoutineDayDetail,
  RoutineDetail,
  SessionDetail,
  WorkoutPeriodSeries,
  WorkoutSession,
  WorkoutSetWithExercise,
} from '../types/workout.types'
import { buildRoutineDetail } from '../utils/routine-detail'
import { buildRoutineDaySnapshots } from '../utils/routine-snapshots'
import { calculateSessionStats, groupSetsByExercise } from '../utils/session-stats'
import { buildWorkoutSeries } from '../utils/workout-series'

/** Músculos secundarios sin el primario: un grupo no es secundario de sí mismo. */
function secondaryMuscles(values: CreateExerciseValues) {
  return (values.secondaryMuscles ?? []).filter((muscle) => muscle !== values.muscleGroup)
}

/** Compone una sesión con sus series agrupadas y su resumen calculado. */
function toSessionDetail(
  session: WorkoutSession,
  sets: readonly WorkoutSetWithExercise[],
  plan: RoutineDayDetail | null = null,
): SessionDetail {
  const exercises = groupSetsByExercise(sets)
  return { session, exercises, stats: calculateSessionStats(session, exercises), plan }
}

/** Día de rutina que originó la sesión, con sus ejercicios prescritos. */
async function loadPlan(routineDayId: string | null): Promise<RoutineDayDetail | null> {
  if (!routineDayId) return null

  const day = await workoutRepository.findRoutineDay(routineDayId)
  // El día puede haberse borrado después de empezar: la sesión sigue siendo
  // válida, simplemente se queda sin plan.
  if (!day) return null

  return { day, exercises: await workoutRepository.listExercisesByDays([day.id]) }
}

/** Sesión completa: sus series y, si nace de una rutina, su plan. */
async function loadSessionDetail(session: WorkoutSession): Promise<SessionDetail> {
  const sets = await workoutRepository.listSetsBySessions([session.id])
  return toSessionDetail(session, sets, await loadPlan(session.routine_day_id))
}

/** Reglas de negocio de entrenamiento. Traduce errores técnicos a `AppError`. */
export const workoutService = {
  async getExercises(): Promise<Exercise[]> {
    try {
      return await workoutRepository.listExercises()
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Crea un ejercicio propio del usuario (queda como `is_custom`). */
  async createExercise(userId: string, values: CreateExerciseValues): Promise<Exercise> {
    try {
      return await workoutRepository.insertExercise({
        user_id: userId,
        name: values.name,
        muscle_group: values.muscleGroup,
        equipment: values.equipment,
        secondary_muscles: secondaryMuscles(values),
        // Sólo se envía si tiene contenido: una nota vacía es «sin nota», no «''».
        ...(values.instructions ? { instructions: values.instructions } : {}),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Edita un ejercicio propio. La RLS impide tocar los globales.
   *
   * Vaciar las notas las borra (`null`), no las deja como cadena vacía.
   */
  async updateExercise(exerciseId: string, values: CreateExerciseValues): Promise<Exercise> {
    try {
      return await workoutRepository.updateExercise(exerciseId, {
        name: values.name,
        muscle_group: values.muscleGroup,
        equipment: values.equipment,
        secondary_muscles: secondaryMuscles(values),
        instructions: values.instructions ?? null,
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Borra un ejercicio propio.
   *
   * Si aún se usa en una rutina o en un entrenamiento, la base lo impide
   * (`on delete restrict`); se traduce a un mensaje claro en vez de un error
   * técnico.
   */
  async deleteExercise(exerciseId: string): Promise<void> {
    try {
      await workoutRepository.deleteExercise(exerciseId)
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw createAppError(
          'conflict',
          'No puedes borrar un ejercicio que ya usas en una rutina o un entrenamiento. Quítalo de ahí primero.',
        )
      }
      throw toAppError(error)
    }
  },

  /** Sesión en curso del usuario, con lo registrado hasta ahora. */
  async getActiveSession(userId: string): Promise<SessionDetail | null> {
    try {
      const session = await workoutRepository.findActiveSession(userId)
      return session ? await loadSessionDetail(session) : null
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Inicia un entrenamiento.
   *
   * Sólo puede haber una sesión en curso: si ya existe, se devuelve esa misma.
   * Así una doble pulsación —o dos dispositivos— nunca parten el entrenamiento
   * en dos registros.
   */
  async startSession(userId: string): Promise<SessionDetail> {
    try {
      const active = await workoutRepository.findActiveSession(userId)
      if (active) return await loadSessionDetail(active)

      return toSessionDetail(await workoutRepository.insertSession(userId), [])
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Inicia un entrenamiento siguiendo un día de rutina.
   *
   * La sesión queda enlazada al día (`routine_day_id`), de donde salen los
   * ejercicios prescritos. Si ya había un entrenamiento en curso se devuelve
   * ese: nunca se pisa lo que el usuario está haciendo.
   */
  async startSessionFromRoutineDay(userId: string, routineDayId: string): Promise<SessionDetail> {
    try {
      const active = await workoutRepository.findActiveSession(userId)
      if (active) return await loadSessionDetail(active)

      const session = await workoutRepository.insertSession(userId, routineDayId)
      return await loadSessionDetail(session)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Registra una serie al final de las que ya tiene ese ejercicio. */
  async logSet({ sessionId, exerciseId, reps, weightKg }: LogSetInput): Promise<void> {
    try {
      const lastSetNumber = await workoutRepository.findLastSetNumber(sessionId, exerciseId)

      await workoutRepository.insertSet({
        session_id: sessionId,
        exercise_id: exerciseId,
        set_number: lastSetNumber + 1,
        reps,
        weight: weightKg,
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Elimina una serie (borrado lógico, para poder sincronizarlo offline). */
  async removeSet(setId: string): Promise<void> {
    try {
      await workoutRepository.softDeleteSet(setId, new Date().toISOString())
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Cierra el entrenamiento y lo deja disponible en el historial. */
  async finishSession(sessionId: string): Promise<void> {
    try {
      await workoutRepository.updateSession(sessionId, {
        status: 'completed',
        ended_at: new Date().toISOString(),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Descarta el entrenamiento: desaparece de la aplicación sin borrarse de la
   * base (`deleted_at`) y queda marcado como no realizado.
   */
  async discardSession(sessionId: string): Promise<void> {
    try {
      await workoutRepository.updateSession(sessionId, {
        status: 'skipped',
        deleted_at: new Date().toISOString(),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Entrenamientos terminados, del más reciente al más antiguo. */
  async getSessionHistory(userId: string, limit: number): Promise<SessionDetail[]> {
    try {
      const sessions = await workoutRepository.listCompletedSessions(userId, limit)
      if (sessions.length === 0) return []

      const sets = await workoutRepository.listSetsBySessions(sessions.map(({ id }) => id))
      const setsBySession = new Map<string, WorkoutSetWithExercise[]>()
      for (const set of sets) {
        const current = setsBySession.get(set.session_id)
        if (current) current.push(set)
        else setsBySession.set(set.session_id, [set])
      }

      return sessions.map((session) =>
        toSessionDetail(session, setsBySession.get(session.id) ?? []),
      )
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * El entrenamiento de un periodo y el del tramo anterior, para Analytics.
   *
   * Dos consultas encadenadas y no más: las sesiones de los dos tramos (que son
   * contiguos) y, con sus ids, las series que hacen falta para el volumen.
   */
  async getSeries(
    userId: string,
    range: DayRange,
    previousRange: DayRange,
    days: readonly Date[],
    previousDays: readonly Date[],
  ): Promise<WorkoutPeriodSeries> {
    try {
      const sessions = await workoutRepository.listCompletedSessionsBetween(
        userId,
        previousRange.fromIso,
        range.toIso,
      )

      const sets = await workoutRepository.listSetsForVolume(sessions.map(({ id }) => id))

      return buildWorkoutSeries(sessions, sets, days, previousDays)
    } catch (error) {
      throw toAppError(error)
    }
  },

  // ─── Rutinas ────────────────────────────────────────────────────────────
  /** Rutinas del usuario, de la más reciente a la más antigua. */
  async getRoutines(userId: string): Promise<Routine[]> {
    try {
      return await workoutRepository.listRoutines(userId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  async createRoutine(userId: string, values: CreateRoutineValues): Promise<Routine> {
    try {
      return await workoutRepository.insertRoutine({
        user_id: userId,
        name: values.name,
        ...(values.goal ? { goal: values.goal } : {}),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Rutina con sus días y ejercicios prescritos, o `null` si no existe. */
  /**
   * Todos los días de rutina del usuario, con sus ejercicios prescritos.
   *
   * Lo consume el Decision Engine para poder proponer una versión corta: sin
   * saber qué se planea entrenar, sugerir «haz media sesión» no dice nada.
   */
  async getRoutineDays(userId: string): Promise<readonly RoutineDaySnapshot[]> {
    try {
      const routines = await workoutRepository.listRoutines(userId)
      if (routines.length === 0) return []

      const days = await workoutRepository.listDaysByRoutines(routines.map(({ id }) => id))
      if (days.length === 0) return []

      const exercises = await workoutRepository.listExercisesByDays(days.map(({ id }) => id))

      return buildRoutineDaySnapshots(routines, days, exercises)
    } catch (error) {
      throw toAppError(error)
    }
  },

  async getRoutineDetail(routineId: string): Promise<RoutineDetail | null> {
    try {
      const routine = await workoutRepository.findRoutine(routineId)
      if (!routine) return null

      const days = await workoutRepository.listDays(routineId)
      const exercises = await workoutRepository.listExercisesByDays(days.map(({ id }) => id))
      return buildRoutineDetail(routine, days, exercises)
    } catch (error) {
      throw toAppError(error)
    }
  },

  async addRoutineDay(routineId: string, name: string): Promise<void> {
    try {
      await workoutRepository.insertRoutineDay(routineId, name)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Prescribe un ejercicio en un día, con sus objetivos opcionales. */
  async addRoutineExercise(
    dayId: string,
    exerciseId: string,
    targets: RoutineExerciseTargetsValues,
  ): Promise<void> {
    try {
      await workoutRepository.insertRoutineExercise({
        routine_day_id: dayId,
        exercise_id: exerciseId,
        ...(targets.targetSets !== undefined ? { target_sets: targets.targetSets } : {}),
        ...(targets.targetReps !== undefined ? { target_reps: targets.targetReps } : {}),
        ...(targets.targetWeightKg !== undefined ? { target_weight: targets.targetWeightKg } : {}),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  async removeRoutineDay(dayId: string): Promise<void> {
    try {
      await workoutRepository.deleteRoutineDay(dayId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  async removeRoutineExercise(routineExerciseId: string): Promise<void> {
    try {
      await workoutRepository.deleteRoutineExercise(routineExerciseId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Borra la rutina (borrado lógico: `deleted_at`, para sincronizarlo offline). */
  async deleteRoutine(routineId: string): Promise<void> {
    try {
      await workoutRepository.updateRoutine(routineId, { deleted_at: new Date().toISOString() })
    } catch (error) {
      throw toAppError(error)
    }
  },
}
