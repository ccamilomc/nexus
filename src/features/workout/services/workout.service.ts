import { toAppError } from '@/core/error'

import { workoutRepository } from '../repositories/workout.repository'
import type {
  Exercise,
  LogSetInput,
  SessionDetail,
  WorkoutSession,
  WorkoutSetWithExercise,
} from '../types/workout.types'
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
}
