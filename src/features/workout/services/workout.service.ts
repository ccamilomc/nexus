import { toAppError } from '@/core/error'

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
  RoutineDetail,
  SessionDetail,
  WorkoutSession,
  WorkoutSetWithExercise,
} from '../types/workout.types'
import { buildRoutineDetail } from '../utils/routine-detail'
import { calculateSessionStats, groupSetsByExercise } from '../utils/session-stats'

/** Compone una sesión con sus series agrupadas y su resumen calculado. */
function toSessionDetail(
  session: WorkoutSession,
  sets: readonly WorkoutSetWithExercise[],
): SessionDetail {
  const exercises = groupSetsByExercise(sets)
  return { session, exercises, stats: calculateSessionStats(session, exercises) }
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
        // Sólo se envía si tiene contenido: una nota vacía es «sin nota», no «''».
        ...(values.instructions ? { instructions: values.instructions } : {}),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Sesión en curso del usuario, con lo registrado hasta ahora. */
  async getActiveSession(userId: string): Promise<SessionDetail | null> {
    try {
      const session = await workoutRepository.findActiveSession(userId)
      if (!session) return null

      const sets = await workoutRepository.listSetsBySessions([session.id])
      return toSessionDetail(session, sets)
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
      if (active) {
        const sets = await workoutRepository.listSetsBySessions([active.id])
        return toSessionDetail(active, sets)
      }

      const session = await workoutRepository.insertSession(userId)
      return toSessionDetail(session, [])
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
