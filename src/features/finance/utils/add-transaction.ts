import type {
  CategorySpend,
  FinanceMonth,
  FinanceTotals,
  FinanceTransactionWithNames,
} from '../types/finance.types'

/**
 * Cuántos movimientos recientes enseña el mes.
 *
 * Vive aquí y no en el servicio porque hacen falta los dos a la vez: el
 * servicio corta la lista al leerla y esto la vuelve a cortar al añadir. Con la
 * cifra en dos sitios, el movimiento recién apuntado podría dejar nueve.
 */
export const RECENT_LIMIT = 8

/**
 * El mes con el movimiento recién apuntado, para verlo antes de que salga.
 *
 * Las cifras **se suman a las que ya había** en vez de recalcularse: sólo se
 * guardan los últimos movimientos del mes, así que rehacer los totales desde
 * ellos daría un mes recortado. Sumar es además exacto.
 *
 * Se respetan las mismas reglas que al leerlos del servidor: un traspaso no es
 * gasto ni ingreso —el dinero sigue siendo tuyo, sólo cambió de cajón— y el
 * gasto fijo no cambia, porque lo que se apunta a mano nunca viene de un pago
 * recurrente.
 */
export function addTransactionToMonth(
  month: FinanceMonth,
  transaction: FinanceTransactionWithNames,
): FinanceMonth {
  const totals = addToTotals(month.totals, transaction)

  return {
    totals,
    byCategory: addToCategories(month.byCategory, transaction, totals.expense),
    recent: [transaction, ...month.recent].slice(0, RECENT_LIMIT),
  }
}

function addToTotals(
  totals: FinanceTotals,
  transaction: FinanceTransactionWithNames,
): FinanceTotals {
  if (transaction.kind === 'transfer') return totals

  const income = totals.income + (transaction.kind === 'income' ? transaction.amount : 0)
  const expense = totals.expense + (transaction.kind === 'expense' ? transaction.amount : 0)

  return { ...totals, income, expense, balance: income - expense }
}

/**
 * El reparto por categoría con el gasto nuevo dentro.
 *
 * Sólo gastos, como al leerlo del servidor. Las porciones se rehacen todas
 * porque el total cambió: si no, sumarían más de cien.
 */
function addToCategories(
  byCategory: readonly CategorySpend[],
  transaction: FinanceTransactionWithNames,
  totalExpense: number,
): readonly CategorySpend[] {
  if (transaction.kind !== 'expense') return byCategory

  const categoryId = transaction.category_id
  const isKnown = byCategory.some((entry) => entry.categoryId === categoryId)

  const updated = isKnown
    ? byCategory.map((entry) =>
        entry.categoryId === categoryId
          ? { ...entry, amount: entry.amount + transaction.amount }
          : entry,
      )
    : [
        ...byCategory,
        {
          categoryId,
          name: transaction.category?.name ?? 'Sin categoría',
          amount: transaction.amount,
          share: 0,
        },
      ]

  return updated
    .map((entry) => ({ ...entry, share: toShare(entry.amount, totalExpense) }))
    .sort((a, b) => b.amount - a.amount)
}

function toShare(amount: number, total: number): number {
  return total <= 0 ? 0 : Math.round((amount / total) * 100)
}
