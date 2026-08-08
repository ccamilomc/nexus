import { toDateKey } from '@/shared/utils'

import type { FinancePeriodSeries, FinanceTransactionWithNames } from '../types/finance.types'
import { calculateTotals } from './finance-totals'

/**
 * Arma la serie de finanzas de un periodo y las cifras del tramo anterior.
 *
 * **Los días sin movimientos valen cero, no hueco.** Un gasto se apunta al
 * hacerlo, así que un día en blanco significa que no salió dinero — mismo
 * criterio que entrenamiento, contrario al de nutrición, donde no haber
 * apuntado sólo significa no haber apuntado.
 *
 * Los totales salen de `calculateTotals`, que es quien sabe que **un traspaso
 * no es gasto ni ingreso**. Repetir aquí ese criterio habría dejado dos
 * verdades sobre lo mismo, y la del gráfico se habría desviado de la del mes en
 * cuanto alguien tocara una.
 */
export function buildFinanceSeries(
  transactions: readonly FinanceTransactionWithNames[],
  days: readonly Date[],
  previousDays: readonly Date[],
): FinancePeriodSeries {
  const currentKeys = new Set(days.map(toDateKey))
  const previousKeys = new Set(previousDays.map(toDateKey))

  const current = transactions.filter(({ occurred_on }) => currentKeys.has(occurred_on))
  const previous = transactions.filter(({ occurred_on }) => previousKeys.has(occurred_on))

  const totals = calculateTotals(current)
  const previousTotals = calculateTotals(previous)

  const expenseByDate = new Map<string, number>()
  const daysWithMovements = new Set<string>()

  for (const transaction of current) {
    // El traspaso no se pinta ni cuenta como día con movimiento: mover dinero
    // de un cajón a otro no es actividad económica, y una barra por ello diría
    // que ese día se gastó algo.
    if (transaction.kind === 'transfer') continue

    daysWithMovements.add(transaction.occurred_on)
    if (transaction.kind !== 'expense') continue

    expenseByDate.set(
      transaction.occurred_on,
      (expenseByDate.get(transaction.occurred_on) ?? 0) + transaction.amount,
    )
  }

  return {
    expensePoints: days.map((day) => {
      const dateKey = toDateKey(day)
      return { dateKey, value: expenseByDate.get(dateKey) ?? 0 }
    }),
    totalExpense: totals.expense,
    previousTotalExpense: previousTotals.expense,
    totalIncome: totals.income,
    previousTotalIncome: previousTotals.income,
    balance: totals.balance,
    fixedExpense: totals.fixedExpense,
    daysWithMovements: daysWithMovements.size,
  }
}
