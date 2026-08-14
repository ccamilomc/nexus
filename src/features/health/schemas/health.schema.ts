import { z } from 'zod'

import { ALL_METRIC_TYPES } from '../constants/health.constants'
import type { BodyMetricType } from '../types/health.types'

/** Un valor imposible es un dedazo, no una medición. */
const MAX_VALUE = 999

/**
 * Cada medida es opcional: se rellenan las que se hayan tomado.
 *
 * Vacío es «no me lo medí», no cero. El campo en blanco lo traduce a ausencia el
 * `setValueAs` del formulario, igual que en el objetivo semanal de estudio.
 */
const optionalValue = z
  .number({ message: 'Escribe un número.' })
  .positive('Tiene que ser mayor que cero.')
  .max(MAX_VALUE, 'Revisa el número: parece un error.')
  .optional()

/**
 * Una sesión de medidas: varias a la vez y con su día.
 *
 * **Se toman juntas, así que se apuntan juntas.** Antes se registraban de una en
 * una: una vuelta de cinta métrica —cintura, cadera, pecho, brazo, muslo— eran
 * cinco formularios seguidos. Y siempre con la fecha de hoy, así que medirse por
 * la mañana y apuntarlo por la noche quedaba bien, pero medirse el domingo y
 * apuntarlo el lunes, no.
 *
 * Enseñar las ocho casillas hace además que se sepa **qué se puede medir**: sólo
 * salían las medidas que ya tenían datos, de modo que quien nunca se midió el
 * cuello no sabía que podía.
 */
export const logMeasurementsSchema = z
  .object({
    date: z.string().min(1, 'Elige el día.'),
    values: z.object(
      Object.fromEntries(ALL_METRIC_TYPES.map((type) => [type, optionalValue])) as Record<
        BodyMetricType,
        typeof optionalValue
      >,
    ),
  })
  // Guardar sin rellenar nada no es un error de datos, pero tampoco es guardar
  // nada: se dice en vez de dejar el botón sin efecto aparente.
  .refine(({ values }) => Object.values(values).some((value) => value !== undefined), {
    message: 'Escribe al menos una medida.',
    path: ['values'],
  })

export type LogMeasurementsValues = z.infer<typeof logMeasurementsSchema>
