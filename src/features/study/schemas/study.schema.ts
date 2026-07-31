import { z } from 'zod'

const MAX_NAME_LENGTH = 60

/** Ocho horas de un tirón: más que eso es un dato mal escrito, no una sesión. */
const MAX_SESSION_MINUTES = 480

/** Un despiste al teclear no debería fijar un objetivo imposible. */
const MAX_WEEKLY_TARGET_MINUTES = 7 * 24 * 60

/**
 * Una materia nueva.
 *
 * El objetivo semanal es opcional: se puede empezar a registrar horas sin
 * comprometerse a ninguna cifra, y ponerla cuando se conozca el ritmo real.
 */
export const createSubjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Escribe un nombre.')
    .max(MAX_NAME_LENGTH, `Máximo ${MAX_NAME_LENGTH} caracteres.`),
  weeklyTargetHours: z
    .number({ message: 'Escribe un número.' })
    .positive('Tiene que ser mayor que cero.')
    .max(MAX_WEEKLY_TARGET_MINUTES / 60, 'Eso supera las horas que tiene una semana.')
    .optional(),
})

export type CreateSubjectValues = z.infer<typeof createSubjectSchema>

/**
 * Una sesión de estudio ya terminada.
 *
 * Se piden minutos y no una hora de inicio y otra de fin: quien registra
 * después de estudiar recuerda «hora y media», no las horas exactas.
 */
export const logStudySchema = z.object({
  subjectId: z.string().min(1, 'Elige una materia.'),
  minutes: z
    .number({ message: 'Escribe cuántos minutos.' })
    .int('Usa minutos enteros.')
    .positive('Tiene que ser mayor que cero.')
    .max(MAX_SESSION_MINUTES, 'Son demasiadas horas seguidas. Divídelo en varias sesiones.'),
  focusRating: z.number().int().min(1).max(5).optional(),
})

export type LogStudyValues = z.infer<typeof logStudySchema>
