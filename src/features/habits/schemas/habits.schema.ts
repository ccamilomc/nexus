import { z } from 'zod'

const MAX_NAME_LENGTH = 60
const MAX_DESCRIPTION_LENGTH = 200

/**
 * Un hábito nuevo.
 *
 * Se pide lo mínimo: nombre y, si hace falta, una nota.
 *
 * Los días son opcionales y **en blanco significa todos los días**, que es lo
 * que quiere casi todo el mundo. Marcar algunos convierte el hábito en uno de
 * días concretos: «gimnasio lunes, miércoles y viernes» deja de aparecer como
 * fallado los otros cuatro.
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
  // Sin `.default()`: con un valor por defecto, lo que entra al formulario y lo
  // que sale de validar dejan de ser el mismo tipo y TypeScript ya no puede
  // comprobar que hablan de lo mismo. El vacío lo pone `defaultValues`.
  weekdays: z.array(z.number().int().min(1).max(7)),
})

export type CreateHabitValues = z.infer<typeof createHabitSchema>
