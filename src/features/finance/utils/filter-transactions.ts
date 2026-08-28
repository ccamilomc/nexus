import { matchesQuery } from '@/shared/utils'

import type { FinanceTransactionWithNames } from '../types/finance.types'

/** «Sin categoría» es un filtro de verdad: son los que hay que repasar. */
export const NO_CATEGORY = 'sin-categoria'

export interface TransactionFilters {
  /** Texto libre: nota, categoría, cuenta o el monto tal cual se teclea. */
  readonly query: string
  readonly kind: 'all' | FinanceTransactionWithNames['kind']
  /** El id de la categoría, `all`, o `NO_CATEGORY`. */
  readonly categoryId: string
}

export const NO_FILTERS: TransactionFilters = { query: '', kind: 'all', categoryId: 'all' }

/** Si algún filtro está puesto; sirve para saber si hay que decir cuántos quedan. */
export function hasFilters(filters: TransactionFilters): boolean {
  return filters.query.trim() !== '' || filters.kind !== 'all' || filters.categoryId !== 'all'
}

/**
 * Dónde se busca cuando se escribe texto.
 *
 * **El monto entra en la búsqueda**, y sin puntos: uno recuerda «fueron como
 * cuarenta y cinco mil» antes que la nota que escribió, y teclear `45000`
 * tiene que encontrarlo aunque en pantalla ponga «$ 45.000».
 *
 * La fecha no entra a propósito: para eso está el navegador de meses, y buscar
 * «08» devolvería todo lo de agosto y además todo lo que cueste 8 pesos.
 */
function searchable(transaction: FinanceTransactionWithNames): string {
  return [
    transaction.note ?? '',
    transaction.category?.name ?? '',
    transaction.account?.name ?? '',
    transaction.toAccount?.name ?? '',
    String(transaction.amount),
  ].join(' ')
}

/**
 * Los movimientos que pasan los filtros, en el mismo orden en que llegaron.
 *
 * **No reordena.** La lista viene del servidor por fecha, y que filtrar
 * cambiara el orden haría dudar de si se está viendo lo mismo.
 */
export function filterTransactions(
  transactions: readonly FinanceTransactionWithNames[],
  filters: TransactionFilters,
): readonly FinanceTransactionWithNames[] {
  return transactions.filter((transaction) => {
    if (filters.kind !== 'all' && transaction.kind !== filters.kind) return false

    if (filters.categoryId === NO_CATEGORY) {
      if (transaction.category_id !== null) return false
    } else if (filters.categoryId !== 'all' && transaction.category_id !== filters.categoryId) {
      return false
    }

    return matchesQuery(searchable(transaction), filters.query)
  })
}
