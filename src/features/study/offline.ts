import type { QueryClient } from '@tanstack/react-query'

import { registerOfflineMutation } from '@/core/offline'

import { studyService } from './services/study.service'
import type { LogStudyInput } from './types/study.types'

/**
 * Cómo se envían las sesiones de estudio que se quedaron esperando red.
 *
 * Vive fuera de los hooks porque se reanudan **sin pantalla**: al abrir la
 * aplicación, lo encolado sale antes de que se monte nada.
 */
export function registerStudyOfflineMutations(client: QueryClient): void {
  registerOfflineMutation<LogStudyInput>(client, 'logStudy', (input) =>
    studyService.logStudy(input),
  )
}
