import { toAppError } from '@/core/error'

import { financeRepository } from '../repositories/finance.repository'
import type { BudgetsOverview, FinanceBudget } from '../types/finance.types'
import { calculateBudgets, calculateMonthBudget } from '../utils/budgets'
import { calculateByCategory, calculateTotals } from '../utils/finance-totals'
import { monthRange } from '../utils/month-range'

/** Los topes: cuánto te propusiste no pasar —en el mes y por categoría— y cómo vas. */
export const budgetsService = {
  /**
   * Cómo van los topes de un mes.
   *
   * **Sólo tiene sentido para el mes en curso.** Un tope es un valor único, no
   * un histórico: enseñar lo que se gastó en julio contra el tope que se puso
   * en agosto sería medir con una regla que entonces no existía. Quien lo pida
   * para otro mes recibe una lista vacía, y la pantalla no dibuja nada.
   */
  async getBudgets(userId: string, month: Date, today: Date): Promise<BudgetsOverview> {
    try {
      const isCurrentMonth =
        month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth()

      if (!isCurrentMonth) return { isCurrentMonth: false, month: null, categories: [] }

      const { fromKey, toKey } = monthRange(month)
      const [budgets, monthBudget, transactions, categories] = await Promise.all([
        financeRepository.listBudgets(userId),
        financeRepository.getMonthBudget(userId),
        financeRepository.listTransactionsBetween(userId, fromKey, toKey),
        financeRepository.listCategories(),
      ])

      // Los mismos movimientos sirven para las dos cuentas. Pedirlos dos veces
      // sería traer el mes entero por segunda vez para la misma pregunta.
      return {
        isCurrentMonth: true,
        month: calculateMonthBudget(monthBudget, calculateTotals(transactions).expense),
        categories: calculateBudgets(budgets, calculateByCategory(transactions), categories),
      }
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Los topes tal cual, para poder editarlos. */
  async getBudgetCaps(userId: string): Promise<FinanceBudget[]> {
    try {
      return await financeRepository.listBudgets(userId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Pone o cambia el tope de una categoría. */
  async setBudget(userId: string, categoryId: string, amount: number): Promise<void> {
    try {
      await financeRepository.upsertBudget({ user_id: userId, category_id: categoryId, amount })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Quita el tope: la categoría vuelve a no tener límite. */
  async removeBudget(budgetId: string): Promise<void> {
    try {
      await financeRepository.deleteBudget(budgetId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Pone o cambia el presupuesto del mes entero. */
  async setMonthBudget(userId: string, amount: number): Promise<void> {
    try {
      await financeRepository.upsertMonthBudget({ user_id: userId, amount })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Quita el presupuesto: el mes vuelve a no tener límite. */
  async removeMonthBudget(userId: string): Promise<void> {
    try {
      await financeRepository.deleteMonthBudget(userId)
    } catch (error) {
      throw toAppError(error)
    }
  },
}
