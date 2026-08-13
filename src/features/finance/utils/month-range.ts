import { toDateKey } from '@/shared/utils'

/**
 * El primer y el último día del mes de una fecha, en `YYYY-MM-DD`.
 *
 * Vive aquí y no dentro de un servicio porque la usan dos: el mes de la pantalla
 * de movimientos y los topes, que miden el gasto contra el mismo tramo. Con una
 * copia en cada sitio, cambiar el criterio en uno dejaría al otro midiendo otra
 * cosa sin que nada avisara.
 */
export function monthRange(date: Date): { readonly fromKey: string; readonly toKey: string } {
  const from = new Date(date.getFullYear(), date.getMonth(), 1)
  // Día 0 del mes siguiente es el último del actual, y así funciona en febrero y
  // en los bisiestos sin tener que saber cuántos días tiene cada mes.
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0)

  return { fromKey: toDateKey(from), toKey: toDateKey(to) }
}
