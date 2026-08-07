import type {
  CategorySpend,
  FinanceTotals,
  FinanceTransactionWithNames,
} from '../types/finance.types'

/** Lo que se muestra cuando un movimiento perdió su categoría o nunca la tuvo. */
export const UNCATEGORISED_LABEL = 'Sin categoría'

/**
 * Ingresos, gastos y saldo de un conjunto de movimientos.
 *
 * El importe siempre viene positivo de la base; la dirección la pone `kind`
 * (ver docs/04). Aquí es donde ese criterio se convierte en aritmética, y es la
 * única función que debería conocerlo.
 *
 * **El saldo puede salir negativo, y se devuelve tal cual.** Recortarlo a cero
 * para que no asuste sería mentir justo cuando más importa acertar.
 */
export function calculateTotals(
  transactions: readonly FinanceTransactionWithNames[],
): FinanceTotals {
  let income = 0
  let expense = 0

  for (const transaction of transactions) {
    if (transaction.kind === 'income') income += transaction.amount
    else expense += transaction.amount
  }

  return { income, expense, balance: income - expense }
}

/**
 * En qué se fue el dinero, de más a menos.
 *
 * Sólo gastos: mezclar el salario con el mercado en el mismo reparto haría que
 * «en qué se me va la plata» respondiera cualquier cosa.
 *
 * Los movimientos sin categoría **no se esconden**: se agrupan y se enseñan como
 * lo que son. Un reparto que suma 80 % y calla el resto invita a confiar en una
 * cifra incompleta.
 */
export function calculateByCategory(
  transactions: readonly FinanceTransactionWithNames[],
): CategorySpend[] {
  const expenses = transactions.filter((transaction) => transaction.kind === 'expense')
  const total = expenses.reduce((sum, transaction) => sum + transaction.amount, 0)

  const byId = new Map<string | null, { name: string; amount: number }>()

  for (const transaction of expenses) {
    const key = transaction.category_id
    const existing = byId.get(key)
    const name = transaction.category?.name ?? UNCATEGORISED_LABEL

    if (existing) existing.amount += transaction.amount
    else byId.set(key, { name, amount: transaction.amount })
  }

  return [...byId.entries()]
    .map(([categoryId, { name, amount }]) => ({
      categoryId,
      name,
      amount,
      // Sin gasto no hay reparto, y dividir por cero daría `NaN` en pantalla.
      share: total === 0 ? 0 : (amount / total) * 100,
    }))
    .sort((a, b) => b.amount - a.amount)
}

/**
 * El saldo de una cuenta: lo que había al empezar más lo que entró, menos lo que
 * salió.
 *
 * Se calcula en vez de almacenarse, como las rachas o los macros: un saldo
 * guardado hay que mantenerlo a mano en cada alta, baja y corrección, y basta
 * con que falle una para que la cifra deje de cuadrar sin que nadie lo note.
 */
export function calculateAccountBalance(
  initialBalance: number,
  transactions: readonly FinanceTransactionWithNames[],
  accountId: string,
): number {
  const ofAccount = transactions.filter((transaction) => transaction.account_id === accountId)
  const { balance } = calculateTotals(ofAccount)

  return initialBalance + balance
}
