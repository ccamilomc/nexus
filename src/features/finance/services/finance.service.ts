import { toAppError } from '@/core/error'
import { toDateKey } from '@/shared/utils'

import { financeRepository } from '../repositories/finance.repository'
import type {
  AccountValues,
  CategoryValues,
  DebtValues,
  TransactionValues,
} from '../schemas/finance.schema'
import type {
  DebtPayment,
  DebtWithBalance,
  FinanceAccount,
  FinanceCategory,
  FinanceDebt,
  FinanceMonth,
  FinanceTransactionWithNames,
} from '../types/finance.types'
import { calculateDebtBalance } from '../utils/debt-balance'
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

/**
 * Traduce el formulario a la fila de la base.
 *
 * **Limpia lo que no aplica al tipo**, y no es cortesía: la base exige que un
 * traspaso lleve cuenta destino y no lleve categoría, y que un gasto sea al
 * revés. Cambiar de tipo en el formulario arrastraría lo elegido antes y la
 * escritura se rechazaría con un error técnico.
 */
function toTransactionRow(values: TransactionValues) {
  const isTransfer = values.kind === 'transfer'

  return {
    account_id: values.accountId,
    counterpart_account_id: isTransfer ? values.toAccountId : null,
    category_id: isTransfer ? null : values.categoryId,
    // Un traspaso mueve dinero entre cuentas propias: no abona ninguna deuda.
    debt_id: isTransfer ? null : values.debtId,
    kind: values.kind,
    amount: values.amount,
    occurred_on: values.occurredOn,
    // Una nota vacía es ausencia de nota, no una nota en blanco.
    note: values.note?.trim() ? values.note.trim() : null,
  }
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

  /**
   * Las deudas con sus cuentas hechas.
   *
   * Los abonos se traen en una sola consulta y se reparten aquí: preguntar
   * deuda por deuda serían tantos viajes como deudas haya, y agrupar en
   * TypeScript es el mismo criterio que Analytics ([ADR-0006](../../../../docs/adr/0006-analytics-agrega-en-el-cliente.md)).
   */
  async getDebts(userId: string, today: Date): Promise<DebtWithBalance[]> {
    try {
      const [debts, payments] = await Promise.all([
        financeRepository.listDebts(userId),
        financeRepository.listDebtPayments(userId),
      ])

      const byDebt = new Map<string, DebtPayment[]>()
      for (const { debt_id, amount, occurred_on } of payments) {
        if (!debt_id) continue
        const list = byDebt.get(debt_id) ?? []
        list.push({ amount, occurredOn: occurred_on })
        byDebt.set(debt_id, list)
      }

      const todayKey = toDateKey(today)

      return debts.map((debt) => ({
        debt,
        balance: calculateDebtBalance(debt, byDebt.get(debt.id) ?? [], todayKey),
      }))
    } catch (error) {
      throw toAppError(error)
    }
  },

  async createDebt(userId: string, values: DebtValues): Promise<FinanceDebt> {
    try {
      return await financeRepository.insertDebt({
        user_id: userId,
        counterpart: values.counterpart,
        direction: values.direction,
        principal: values.principal,
        interest_kind: values.interestKind,
        // Sin intereses no hay tasa que guardar, y la base lo exige así.
        interest_rate: values.interestKind === 'none' ? null : values.interestRate,
        started_on: values.startedOn,
        due_on: values.dueOn ?? null,
        instalments: values.instalments ?? null,
        note: values.note?.trim() ? values.note.trim() : null,
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Da una deuda por saldada, o la reabre.
   *
   * **Se marca a mano y no cuando los abonos cubren el monto.** Que las cuentas
   * cuadren no siempre significa que la otra persona la dé por cerrada, y
   * cerrarla sola dejaría de contar intereses de algo que sigue vivo.
   */
  /**
   * Quita una deuda apuntada por error.
   *
   * **No es lo mismo que saldarla:** saldada significa «ya la pagué» y se queda
   * en el histórico; borrada significa «no existía». Sus abonos siguen siendo
   * gastos, porque el dinero salió igual.
   */
  async removeDebt(debtId: string): Promise<void> {
    try {
      await financeRepository.softDeleteDebt(debtId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  async setDebtSettled(debtId: string, isSettled: boolean): Promise<void> {
    try {
      await financeRepository.setDebtSettled(debtId, isSettled ? new Date().toISOString() : null)
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
      await financeRepository.insertTransaction({ user_id: userId, ...toTransactionRow(values) })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Corrige un movimiento ya apuntado.
   *
   * Se puede cambiar todo, incluido el tipo: un gasto mal clasificado como
   * ingreso se arregla en el sitio, sin borrarlo y volver a escribirlo. Por eso
   * `toTransactionRow` limpia lo que no aplica —pasar de gasto a traspaso deja
   * la categoría atrás— en vez de sólo escribir lo que cambió.
   */
  async updateTransaction(transactionId: string, values: TransactionValues): Promise<void> {
    try {
      await financeRepository.updateTransaction(transactionId, toTransactionRow(values))
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
