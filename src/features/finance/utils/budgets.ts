import type {
  BudgetStatus,
  CategorySpend,
  FinanceBudget,
  FinanceCategory,
} from '../types/finance.types'

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
 *
 * **El nombre sale del catálogo, no del gasto.** Sacarlo del gasto dejaba sin
 * nombre justo el caso que más importa: el tope que todavía no has empezado a
 * gastar, que es el que aparece con todo por delante.
 */
export function calculateBudgets(
  budgets: readonly FinanceBudget[],
  spendByCategory: readonly CategorySpend[],
  categories: readonly FinanceCategory[],
): BudgetStatus[] {
  const spentById = new Map(spendByCategory.map((entry) => [entry.categoryId, entry.amount]))
  const nameById = new Map(categories.map((category) => [category.id, category.name]))

  return budgets
    .map((budget) => {
      const spent = spentById.get(budget.category_id) ?? 0
      const cap = budget.amount

      return {
        categoryId: budget.category_id,
        // Si la categoría se archivó, su tope sigue midiendo lo gastado y hay
        // que poder nombrarlo: se cae al nombre que traiga el gasto.
        name:
          nameById.get(budget.category_id) ??
          spendByCategory.find((entry) => entry.categoryId === budget.category_id)?.name ??
          '',
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
