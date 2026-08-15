import type { QueryClient } from '@tanstack/react-query'

import { registerFinanceOfflineMutations } from '@/features/finance'
import { registerHabitsOfflineMutations } from '@/features/habits'
import { registerNutritionOfflineMutations } from '@/features/nutrition'
import { registerSleepOfflineMutations } from '@/features/sleep'
import { registerStudyOfflineMutations } from '@/features/study'
import { registerWorkoutOfflineMutations } from '@/features/workout'

/**
 * Deja registrado cómo se envía todo lo que se pueda haber quedado pendiente.
 *
 * Se llama **antes de restaurar la caché**: lo primero que hace TanStack al
 * restaurar es reanudar lo encolado, y para eso cada clave ya tiene que saber
 * qué función ejecutar. Registrarlo después llegaría tarde.
 *
 * Vive en `app/` porque es el único sitio que puede conocer todas las features
 * sin que ninguna dependa de otra; cada una aporta las suyas (ADR-0011).
 */
export function registerOfflineMutations(client: QueryClient): void {
  registerFinanceOfflineMutations(client)
  registerHabitsOfflineMutations(client)
  registerNutritionOfflineMutations(client)
  registerSleepOfflineMutations(client)
  registerStudyOfflineMutations(client)
  registerWorkoutOfflineMutations(client)
}
