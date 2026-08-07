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
  let fixedExpense = 0

  for (const transaction of transactions) {
    // **Los traspasos no cuentan.** Pasar dinero de efectivo a Nequi no es
    // gasto ni ingreso: el dinero sigue siendo tuyo, sólo cambió de cajón.
    // Contarlos inflaría los dos totales y «cuánto gasté este mes» dejaría de
    // ser cierto en cuanto tuvieras dos cuentas.
    if (transaction.kind === 'transfer') continue

    if (transaction.kind === 'income') {
      income += transaction.amount
      continue
    }

    expense += transaction.amount
    // Lo fijo **no se resta** del gasto: es una parte de él, contada aparte
    // para poder decir cuánto de lo que sale ya estaba decidido.
    if (transaction.recurring_id !== null) fixedExpense += transaction.amount
  }

  return { income, expense, fixedExpense, balance: income - expense }
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
  let balance = initialBalance

  for (const transaction of transactions) {
    const isOrigin = transaction.account_id === accountId

    // Un traspaso sí mueve el saldo de las dos cuentas, aunque no aparezca en
    // los totales del mes: sale de una y entra en la otra.
    if (transaction.kind === 'transfer') {
      if (isOrigin) balance -= transaction.amount
      else if (transaction.counterpart_account_id === accountId) balance += transaction.amount
      continue
    }

    if (!isOrigin) continue
    if (transaction.kind === 'income') balance += transaction.amount
    else balance -= transaction.amount
  }

  return balance
}
