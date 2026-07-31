import { z } from 'zod'

import { ALL_METRIC_TYPES } from '../constants/health.constants'
import type { BodyMetricType } from '../types/health.types'

/** Un valor imposible es un dedazo, no una medición. */
const MAX_VALUE = 999

/**
 * Una medición corporal.
 *
 * Se pide sólo el tipo y el valor: la unidad la pone el sistema (kg, cm, %) y
 * la fecha es la de ahora, porque uno se pesa en el momento de anotarlo.
 */
export const logMetricSchema = z.object({
  metricType: z.enum(ALL_METRIC_TYPES as [BodyMetricType, ...BodyMetricType[]]),
  value: z
    .number({ message: 'Escribe un número.' })
    .positive('Tiene que ser mayor que cero.')
    .max(MAX_VALUE, 'Revisa el número: parece un error.'),
})

export type LogMetricValues = z.infer<typeof logMetricSchema>
