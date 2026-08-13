import { toAppError } from '@/core/error'

import { financeRepository } from '../repositories/finance.repository'
import type { BudgetStatus, FinanceBudget } from '../types/finance.types'
import { calculateBudgets } from '../utils/budgets'
import { calculateByCategory } from '../utils/finance-totals'
import { monthRange } from '../utils/month-range'

/** Los topes por categoría: cuánto te propusiste no pasar y cómo vas. */
export const budgetsService = {
  /**
   * Cómo van los topes de un mes.
   *
   * **Sólo tiene sentido para el mes en curso.** Un tope es un valor único, no
   * un histórico: enseñar lo que se gastó en julio contra el tope que se puso
   * en agosto sería medir con una regla que entonces no existía. Quien lo pida
   * para otro mes recibe una lista vacía, y la pantalla no dibuja nada.
   */
  async getBudgets(userId: string, month: Date, today: Date): Promise<BudgetStatus[]> {
    try {
      const isCurrentMonth =
        month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth()

      if (!isCurrentMonth) return []

      const { fromKey, toKey } = monthRange(month)
      const [budgets, transactions, categories] = await Promise.all([
        financeRepository.listBudgets(userId),
        financeRepository.listTransactionsBetween(userId, fromKey, toKey),
        financeRepository.listCategories(),
      ])

      return calculateBudgets(budgets, calculateByCategory(transactions), categories)
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
}
