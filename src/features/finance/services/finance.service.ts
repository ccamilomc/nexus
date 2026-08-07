import { toAppError } from '@/core/error'
import { toDateKey } from '@/shared/utils'

import { financeRepository } from '../repositories/finance.repository'
import type { AccountValues, CategoryValues, TransactionValues } from '../schemas/finance.schema'
import type {
  FinanceAccount,
  FinanceCategory,
  FinanceMonth,
  FinanceTransactionWithNames,
} from '../types/finance.types'
import { calculateByCategory, calculateTotals } from '../utils/finance-totals'

/** Cuántos movimientos recientes se enseñan sin pedir «ver todos». */
const RECENT_LIMIT = 8

/** El primer y el último día del mes de una fecha, en `YYYY-MM-DD`. */
function monthRange(date: Date): { readonly fromKey: string; readonly toKey: string } {
  const from = new Date(date.getFullYear(), date.getMonth(), 1)
  // Día 0 del mes siguiente es el último del actual, y así funciona en febrero
  // y en los bisiestos sin tener que saber cuántos días tiene cada mes.
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0)

  return { fromKey: toDateKey(from), toKey: toDateKey(to) }
}

/** Reglas de negocio de finanzas. Traduce errores técnicos a `AppError`. */
export const financeService = {
  async getAccounts(userId: string): Promise<FinanceAccount[]> {
    try {
      return await financeRepository.listAccounts(userId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  async getCategories(): Promise<FinanceCategory[]> {
    try {
      return await financeRepository.listCategories()
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * El mes de una fecha: totales, reparto por categoría y los últimos
   * movimientos.
   *
   * Una sola consulta para las tres cosas. Se agrega **en el cliente**, con el
   * mismo criterio que Analytics ([ADR-0006](../../../../docs/adr/0006-analytics-agrega-en-el-cliente.md)):
   * las reglas ya viven probadas en TypeScript y duplicarlas en SQL sería
   * mantener dos verdades.
   */
  async getMonth(userId: string, date: Date): Promise<FinanceMonth> {
    try {
      const { fromKey, toKey } = monthRange(date)
      const transactions = await financeRepository.listTransactionsBetween(userId, fromKey, toKey)

      return {
        totals: calculateTotals(transactions),
        byCategory: calculateByCategory(transactions),
        recent: transactions.slice(0, RECENT_LIMIT),
      }
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Los movimientos de un tramo, para listarlos enteros. */
  async getTransactions(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<FinanceTransactionWithNames[]> {
    try {
      return await financeRepository.listTransactionsBetween(userId, toDateKey(from), toDateKey(to))
    } catch (error) {
      throw toAppError(error)
    }
  },

  async createAccount(userId: string, values: AccountValues): Promise<FinanceAccount> {
    try {
      return await financeRepository.insertAccount({
        user_id: userId,
        name: values.name,
        kind: values.kind,
        initial_balance: values.initialBalance,
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  async createCategory(userId: string, values: CategoryValues): Promise<FinanceCategory> {
    try {
      return await financeRepository.insertCategory({
        user_id: userId,
        name: values.name,
        kind: values.kind,
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Retira una categoría de los formularios sin tocar el histórico.
   *
   * La RLS impide archivar una del catálogo global, así que no hace falta
   * comprobarlo aquí: quien lo intente recibe un error de permisos, no un
   * borrado silencioso de algo que era de todos.
   */
  async archiveCategory(categoryId: string): Promise<void> {
    try {
      await financeRepository.archiveCategory(categoryId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  async archiveAccount(accountId: string): Promise<void> {
    try {
      await financeRepository.archiveAccount(accountId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  async createTransaction(userId: string, values: TransactionValues): Promise<void> {
    try {
      await financeRepository.insertTransaction({
        user_id: userId,
        account_id: values.accountId,
        category_id: values.categoryId,
        kind: values.kind,
        amount: values.amount,
        occurred_on: values.occurredOn,
        // Una nota vacía es ausencia de nota, no una nota en blanco.
        note: values.note?.trim() ? values.note.trim() : null,
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  async removeTransaction(transactionId: string): Promise<void> {
    try {
      await financeRepository.softDeleteTransaction(transactionId)
    } catch (error) {
      throw toAppError(error)
    }
  },
}
