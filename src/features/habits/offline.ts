import type { QueryClient } from '@tanstack/react-query'

import { registerOfflineMutation } from '@/core/offline'

import { habitsService, type ToggleHabitInput } from './services/habits.service'

/**
 * Cómo se envían los días que se marcaron sin red.
 *
 * Vive fuera de los hooks porque se reanudan **sin pantalla**: al abrir la
 * aplicación, lo encolado sale antes de que se monte nada.
 */
export function registerHabitsOfflineMutations(client: QueryClient): void {
  registerOfflineMutation<ToggleHabitInput>(client, 'toggleHabit', (input) =>
    habitsService.toggleHabit(input),
  )
}
