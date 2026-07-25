import { z } from 'zod'

const MAX_SERVINGS = 100

/**
 * Cantidad consumida de un alimento, en porciones.
 *
 * Admite decimales (media porción es normal) pero no cero: registrar «nada»
 * no es un registro.
 */
export const addFoodSchema = z.object({
  servings: z
    .number('Escribe la cantidad.')
    .positive('Debe ser mayor que cero.')
    .max(MAX_SERVINGS, `Máximo ${MAX_SERVINGS}.`),
})

export type AddFoodValues = z.infer<typeof addFoodSchema>
