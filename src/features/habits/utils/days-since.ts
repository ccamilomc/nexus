import { previousDay, toDateKey } from '@/shared/utils'

/**
 * Días que se miran hacia atrás buscando la última vez.
 *
 * Coincide con la ventana que trae el servicio. Más allá el dato no está, y
 * pasado un par de meses la cifra exacta ya no dice nada: lo que hay que saber
 * es que el hábito se abandonó.
 */
export const MAX_LOOKBACK_DAYS = 60

/**
 * Cuántos días hace que no se cumple un hábito.
 *
 * Es lo que convierte una lista de hábitos en algo que ayuda a elegir: con tres
 * sin marcar, el que importa es el que se está cayendo. La aplicación tenía el
 * dato —el mini-calendario lo enseña en cuadritos— y no lo decía.
 *
 * Devuelve `0` si se cumplió hoy y `null` cuando no hay ninguna marca en la
 * ventana o el hábito es más nuevo que ella: ahí no hay nada que contar y
 * escribir «60 días» sería inventarse un pasado que no existe.
 *
 * No cuenta desde la creación del hábito: uno recién creado y sin marcar aún no
 * se ha «dejado de hacer».
 */
export function daysSinceDone(
  completedDates: ReadonlySet<string>,
  today: Date,
  createdAt: Date,
): number | null {
  const createdKey = toDateKey(createdAt)
  let cursor = today

  for (let days = 0; days <= MAX_LOOKBACK_DAYS; days += 1) {
    const key = toDateKey(cursor)

    if (completedDates.has(key)) return days
    // Antes de existir no se dejaba de hacer nada.
    if (key < createdKey) return null

    cursor = previousDay(cursor)
  }

  return null
}
