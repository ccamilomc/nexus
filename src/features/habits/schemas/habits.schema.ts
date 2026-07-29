import { z } from 'zod'

const MAX_NAME_LENGTH = 60
const MAX_DESCRIPTION_LENGTH = 200

/**
 * Un hábito nuevo.
 *
 * Se pide lo mínimo: nombre y, si hace falta, una nota. La frecuencia arranca
 * en diaria porque es lo que cubre casi todos los casos; las semanales y
 * personalizadas llegarán cuando haya un caso real que las pida (YAGNI).
 */
export const createHabitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Escribe un nombre.')
    .max(MAX_NAME_LENGTH, `Máximo ${MAX_NAME_LENGTH} caracteres.`),
  description: z
    .string()
    .trim()
    .max(MAX_DESCRIPTION_LENGTH, `Máximo ${MAX_DESCRIPTION_LENGTH} caracteres.`)
    .optional(),
})

export type CreateHabitValues = z.infer<typeof createHabitSchema>
