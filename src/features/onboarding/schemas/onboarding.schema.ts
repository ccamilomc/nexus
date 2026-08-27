import { z } from 'zod'

/**
 * Un número opcional escrito a mano.
 *
 * Se queda en `number | null` de punta a punta —sin transformar— para que lo
 * que el formulario tiene dentro y lo que sale al validar sean lo mismo. Con una
 * transformación de por medio, TypeScript deja de poder comprobar que el
 * formulario y el esquema hablan de lo mismo, que es justo para lo que está.
 *
 * El campo vacío lo convierte a `null` el propio control al registrarse.
 */
function optionalNumber(min: number, max: number, message: string) {
  return z.number().min(min, message).max(max, message).nullable()
}

/**
 * Los datos del cuerpo, todos opcionales a propósito.
 *
 * Nada de esto hace falta para usar Nexus: sirven para el IMC y para proponer
 * unas calorías. Obligar a darlos convertiría la bienvenida en un peaje, y
 * quien no quiera decir su edad o su sexo tiene que poder seguir igual.
 */
export const bodySchema = z.object({
  weightKg: optionalNumber(20, 400, 'Revisa el peso.'),
  heightCm: optionalNumber(80, 250, 'Revisa la estatura.'),
  birthDate: z.string().nullable(),
  sex: z.enum(['female', 'male', 'other', 'unspecified']),
})

export type BodyValues = z.infer<typeof bodySchema>

/** Los objetivos que se pueden fijar desde la bienvenida. */
export const goalsSchema = z.object({
  caloriesTarget: z.number().min(800, 'Muy poco.').max(8000, 'Demasiado.'),
  sleepHours: z.number().min(3, 'Muy poco.').max(14, 'Demasiado.'),
})

export type GoalsValues = z.infer<typeof goalsSchema>
