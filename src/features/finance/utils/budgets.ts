import type { BudgetStatus, CategorySpend, FinanceBudget } from '../types/finance.types'

/**
 * Cuánto va del mes, de 0 a 100.
 *
 * Es la mitad que falta para que un tope signifique algo: «llevas el 80 %» es
 * tranquilizador el día 28 y una alarma el día 10.
 */
export function monthProgressPercent(today: Date): number {
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

  return (today.getDate() / daysInMonth) * 100
}

/**
 * Cómo va cada tope del mes.
 *
 * **Sale de los topes, no de lo gastado**, y esa es la diferencia que importa:
 * una categoría con tope y cero gastos tiene que aparecer —«te quedan
 * $400.000»— porque saber lo que queda es la mitad del sentido de ponerlo. Al
 * revés, sólo verías los topes que ya empezaste a gastar.
 *
 * Lo gastado sin tope no entra aquí: eso ya lo cuenta «en qué se fue».
 */
export function calculateBudgets(
  budgets: readonly FinanceBudget[],
  spendByCategory: readonly CategorySpend[],
): BudgetStatus[] {
  const spentById = new Map(spendByCategory.map((entry) => [entry.categoryId, entry.amount]))
  const nameById = new Map(spendByCategory.map((entry) => [entry.categoryId, entry.name]))

  return budgets
    .map((budget) => {
      const spent = spentById.get(budget.category_id) ?? 0
      const cap = budget.amount

      return {
        categoryId: budget.category_id,
        // Si no se gastó nada en ella este mes, su nombre no viene con el gasto
        // y lo pone quien llama; aquí se deja vacío antes que inventarlo.
        name: nameById.get(budget.category_id) ?? '',
        spent,
        cap,
        // Puede pasar de 100: recortarlo escondería justo cuánto te pasaste.
        percent: (spent / cap) * 100,
        remaining: cap - spent,
        isExceeded: spent > cap,
      }
    })
    .sort((a, b) => b.percent - a.percent)
}
