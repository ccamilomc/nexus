import { z } from 'zod'

// Del módulo generado, no del barrel: evita arrastrar el cliente de Supabase
// (y su lectura de env) a una validación pura. Ver workout.constants.ts.
import { Constants } from '@/core/supabase/database.types'

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

const MAX_GOAL_LENGTH = 200
const MAX_DAY_NAME_LENGTH = 60
const MAX_TARGET_SETS = 20
const MAX_TARGET_REPS = 100

/** Datos de una rutina nueva. El objetivo es texto libre y opcional. */
export const createRoutineSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Escribe un nombre.')
    .max(MAX_NAME_LENGTH, `Máximo ${MAX_NAME_LENGTH} caracteres.`),
  goal: z.string().trim().max(MAX_GOAL_LENGTH, `Máximo ${MAX_GOAL_LENGTH} caracteres.`).optional(),
})

export type CreateRoutineValues = z.infer<typeof createRoutineSchema>

/** Un día dentro de una rutina (p. ej. «Empuje»). */
export const addRoutineDaySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Escribe un nombre.')
    .max(MAX_DAY_NAME_LENGTH, `Máximo ${MAX_DAY_NAME_LENGTH} caracteres.`),
})

export type AddRoutineDayValues = z.infer<typeof addRoutineDaySchema>

/**
 * Objetivos de un ejercicio prescrito. Todos opcionales: una rutina puede sólo
 * listar ejercicios sin fijar cifras. Un peso de cero es válido (peso corporal).
 */
export const routineExerciseTargetsSchema = z.object({
  targetSets: z.number().int('Sin decimales.').min(1, 'Mínimo 1.').max(MAX_TARGET_SETS).optional(),
  targetReps: z.number().int('Sin decimales.').min(1, 'Mínimo 1.').max(MAX_TARGET_REPS).optional(),
  targetWeightKg: z.number().min(0, 'No puede ser negativo.').max(MAX_WEIGHT_KG).optional(),
})

export type RoutineExerciseTargetsValues = z.infer<typeof routineExerciseTargetsSchema>
