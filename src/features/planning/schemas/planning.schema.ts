import { z } from 'zod'

/** Dominios a los que puede pertenecer algo del plan. */
export const PLAN_DOMAINS = ['workout', 'nutrition', 'study', 'habit', 'sleep', 'health'] as const

/**
 * Un elemento nuevo del plan del día.
 *
 * La hora es **opcional** a propósito: hay cosas que uno se propone hacer «hoy»
 * sin decidir cuándo, y obligar a inventarse una hora sólo produce horas falsas
 * que luego el motor se tomaría en serio.
 */
export const planItemSchema = z.object({
  title: z.string().trim().min(1, 'Escribe qué quieres hacer.').max(80, 'Usa un título más corto.'),
  domain: z.enum(PLAN_DOMAINS),
  /** `HH:MM` en hora local, o vacío si no se fija. */
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato 18:30.')
    .optional()
    .or(z.literal('')),
  durationMinutes: z
    .number()
    .int()
    .min(5, 'Al menos 5 minutos.')
    .max(480, 'Como mucho 8 horas.')
    .optional(),
})

export type PlanItemValues = z.infer<typeof planItemSchema>
