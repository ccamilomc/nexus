import type { QueryClient } from '@tanstack/react-query'

import { registerOfflineMutation } from '@/core/offline'

import { sleepService } from './services/sleep.service'
import type { LogSleepInput } from './types/sleep.types'

/**
 * Cómo se envían las noches que se apuntaron sin red.
 *
 * Vive fuera de los hooks porque se reanudan **sin pantalla**: al abrir la
 * aplicación, lo encolado sale antes de que se monte nada.
 */
export function registerSleepOfflineMutations(client: QueryClient): void {
  registerOfflineMutation<LogSleepInput>(client, 'logSleep', (input) =>
    sleepService.logSleep(input),
  )
}
