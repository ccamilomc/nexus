import { formatCop } from '@/shared/utils'

import type {
  BudgetStatus,
  CategorySpend,
  FinanceBudget,
  FinanceCategory,
  FinanceMonthBudget,
  SpendAgainstCap,
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
        ...compareToCap(spent, cap),
      }
    })
    .sort((a, b) => b.percent - a.percent)
}

/**
 * Lo gastado contra un límite.
 *
 * **Una sola cuenta para el mes y para cada categoría.** Escribirla dos veces
 * es cómo acaban dos barras de la misma tarjeta significando cosas distintas:
 * basta con que una recorte el porcentaje a 100 y la otra no.
 *
 * El porcentaje puede pasar de 100 a propósito, porque recortarlo escondería
 * justo cuánto te pasaste. El límite nunca es cero: la base lo exige mayor.
 */
export function compareToCap(spent: number, cap: number): SpendAgainstCap {
  return {
    spent,
    cap,
    percent: (spent / cap) * 100,
    remaining: cap - spent,
    isExceeded: spent > cap,
  }
}

/**
 * Cómo va el presupuesto del mes.
 *
 * **Se mide contra el gasto del mes, no contra la suma de los topes.** La mayor
 * parte del gasto no tiene tope por categoría, así que sumarlos contestaría
 * otra pregunta —y una más pequeña— que la de «¿cuánto llevo gastado?».
 *
 * Los traspasos no cuentan porque no son gasto: el dinero cambió de cajón. Eso
 * ya viene resuelto de `calculateTotals`.
 */
export function calculateMonthBudget(
  budget: FinanceMonthBudget | null,
  monthExpense: number,
): SpendAgainstCap | null {
  return budget === null ? null : compareToCap(monthExpense, budget.amount)
}

/**
 * Cómo se le cuenta al usuario que va, en palabras.
 *
 * **Va aquí y no en cada tarjeta** porque lo dicen dos sitios —el presupuesto
 * del mes y cada tope— y dos copias de la misma frase acaban divergiendo justo
 * en el caso raro: el de haberse pasado.
 *
 * «Vas por delante del mes» no es lo mismo que «te pasaste»: con el 80 % del
 * tope el día 10 no te has pasado de nada, pero acabas mal. Los diez puntos de
 * margen evitan avisar por ir un día adelantado.
 */
export function capMessage(status: SpendAgainstCap, monthProgress: number): string {
  if (status.isExceeded) return `Te pasaste ${formatCop(Math.abs(status.remaining))}.`

  const isAhead = status.percent > monthProgress + 10

  return isAhead
    ? `Te quedan ${formatCop(status.remaining)}, y vas por delante del mes.`
    : `Te quedan ${formatCop(status.remaining)}.`
}
