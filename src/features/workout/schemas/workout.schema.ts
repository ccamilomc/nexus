import { z } from 'zod'

const MAX_REPS = 500
const MAX_WEIGHT_KG = 1000

/**
 * Serie registrada a mano.
 *
 * Los mensajes son cortos porque se leen bajo campos pequeños, en el gimnasio.
 * Un peso de cero es válido: es el ejercicio hecho con el propio cuerpo.
 */
export const logSetSchema = z.object({
  reps: z
    .number('Escribe las repeticiones.')
    .int('Sin decimales.')
    .min(1, 'Mínimo 1.')
    .max(MAX_REPS, `Máximo ${MAX_REPS}.`),
  weightKg: z
    .number('Escribe el peso.')
    .min(0, 'No puede ser negativo.')
    .max(MAX_WEIGHT_KG, `Máximo ${MAX_WEIGHT_KG} kg.`),
})

export type LogSetValues = z.infer<typeof logSetSchema>
