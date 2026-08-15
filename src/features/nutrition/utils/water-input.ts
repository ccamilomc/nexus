import { toLoggedAt } from '@/shared/utils'

import type { AddWaterInput } from '../services/nutrition.service'

/**
 * Arma un registro de agua listo para enviarse **o para esperar a que haya red**.
 *
 * Todo queda resuelto aquí, en el momento de tocar el botón: el id, para que la
 * pantalla pueda enseñar el vaso antes de que salga, y el instante, porque un
 * vaso apuntado a las diez sin señal tiene que constar a las diez y no a la hora
 * en que volvió la conexión.
 *
 * El id entra por parámetro para que la función sea pura: lo genera quien la
 * llama.
 */
export function buildAddWaterInput(input: {
  readonly id: string
  readonly userId: string
  readonly amountMl: number
  /** El día que se está mirando, que no tiene por qué ser hoy. */
  readonly date: Date
  readonly now: Date
}): AddWaterInput {
  return {
    id: input.id,
    userId: input.userId,
    amountMl: input.amountMl,
    loggedAt: toLoggedAt(input.date, input.now),
  }
}
