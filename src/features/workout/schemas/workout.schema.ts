import { z } from 'zod'

import { Constants } from '@/core/supabase'

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

const MAX_NAME_LENGTH = 80
const MAX_INSTRUCTIONS_LENGTH = 1000

/**
 * Ejercicio propio del usuario. Los valores de enum salen de `Constants`
 * (generado desde la base), única fuente de verdad de los valores válidos.
 */
export const createExerciseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Escribe un nombre.')
    .max(MAX_NAME_LENGTH, `Máximo ${MAX_NAME_LENGTH} caracteres.`),
  muscleGroup: z.enum(Constants.public.Enums.muscle_group),
  equipment: z.enum(Constants.public.Enums.equipment),
  instructions: z
    .string()
    .trim()
    .max(MAX_INSTRUCTIONS_LENGTH, `Máximo ${MAX_INSTRUCTIONS_LENGTH} caracteres.`)
    .optional(),
})

export type CreateExerciseValues = z.infer<typeof createExerciseSchema>
