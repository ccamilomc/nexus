import type { QueryClient } from '@tanstack/react-query'

import { registerOfflineMutation } from '@/core/offline'

import { workoutService } from './services/workout.service'
import type { LogSetInput } from './types/workout.types'

/**
 * Cómo se envían las series que se quedaron esperando red.
 *
 * Vive fuera de los hooks porque se reanudan **sin pantalla**: al abrir la
 * aplicación, lo encolado sale antes de que se monte nada, y lo único que hay
 * entonces son las variables guardadas.
 */
export function registerWorkoutOfflineMutations(client: QueryClient): void {
  registerOfflineMutation<LogSetInput>(client, 'logSet', (input) => workoutService.logSet(input))
}
