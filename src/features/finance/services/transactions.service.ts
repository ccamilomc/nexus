import { toAppError } from '@/core/error'
import { toDateKey } from '@/shared/utils'

import { financeRepository } from '../repositories/finance.repository'
import type { TransactionValues } from '../schemas/finance.schema'
import type {
  FinanceMonth,
  FinancePeriodSeries,
  FinanceTransactionWithNames,
} from '../types/finance.types'
import { buildFinanceSeries } from '../utils/finance-series'
import { calculateByCategory, calculateTotals } from '../utils/finance-totals'
import { monthRange } from '../utils/month-range'

/** Cuántos movimientos recientes se enseñan sin pedir «ver todos». */
const RECENT_LIMIT = 8

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

/** Los movimientos: apuntarlos, corregirlos y agregarlos por mes o por periodo. */
export const transactionsService = {
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

  /**
   * Las finanzas de un periodo y las del tramo anterior, para Analytics.
   *
   * **Una sola consulta para los dos tramos**, que son contiguos: pedirlos por
   * separado serían dos viajes para lo que cabe en un rango. Se agrega en el
   * cliente, con el mismo criterio que el resto de Analytics
   * ([ADR-0006](../../../../docs/adr/0006-analytics-agrega-en-el-cliente.md)).
   */
  async getSeries(
    userId: string,
    days: readonly Date[],
    previousDays: readonly Date[],
  ): Promise<FinancePeriodSeries> {
    try {
      const all = [...previousDays, ...days]
      const first = all[0]
      const last = all[all.length - 1]
      if (!first || !last) return buildFinanceSeries([], days, previousDays)

      const transactions = await financeRepository.listTransactionsBetween(
        userId,
        toDateKey(first),
        toDateKey(last),
      )

      return buildFinanceSeries(transactions, days, previousDays)
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
