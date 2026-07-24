import { toAppError } from '@/core/error'

import { type Exercise, workoutRepository } from '../repositories/workout.repository'

/** Reglas de negocio de entrenamiento. Traduce errores técnicos a `AppError`. */
export const workoutService = {
  async getExercises(): Promise<Exercise[]> {
    try {
      return await workoutRepository.listExercises()
    } catch (error) {
      throw toAppError(error)
    }
  },
}
