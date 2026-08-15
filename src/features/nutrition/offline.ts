import type { QueryClient } from '@tanstack/react-query'

import { registerOfflineMutation } from '@/core/offline'

import { type AddWaterInput, nutritionService } from './services/nutrition.service'

/**
 * Cómo se envía lo que nutrición dejó pendiente por falta de red.
 *
 * Vive fuera de los hooks porque se reanuda **sin pantalla**: al abrir la
 * aplicación, TanStack restaura lo que había encolado y lo manda antes de que
 * se monte nada. Lo único que tiene entonces son las variables guardadas.
 */
export function registerNutritionOfflineMutations(client: QueryClient): void {
  registerOfflineMutation<AddWaterInput>(client, 'addWater', (input) =>
    nutritionService.addWater(input),
  )
}
