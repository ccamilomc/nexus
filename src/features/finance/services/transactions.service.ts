import { createAppError, isRaisedError, toAppError } from '@/core/error'
import {
  COMPARABLE_WINDOWS,
  minusDays,
  toDateKey,
  type WindowBaseline,
  windowBaselines,
} from '@/shared/utils'

import { financeRepository } from '../repositories/finance.repository'
import type { TransactionValues } from '../schemas/finance.schema'
import type {
  FinanceMonth,
  FinancePeriodSeries,
  FinanceTransactionWithNames,
} from '../types/finance.types'
import { type CategoryTypical, categoryTypicals } from '../utils/category-typicals'
import { buildFinanceSeries } from '../utils/finance-series'
import { calculateByCategory, calculateTotals } from '../utils/finance-totals'
import { monthRange } from '../utils/month-range'

/**
 * Días de gastos que se miran para saber lo normal de una categoría.
 *
 * Ver `getCategoryTypicals`, donde está la medida que lo eligió.
 */
const TYPICAL_DAYS = 180

/** Lo que se sabe de cuánto sueles gastar, de una sola consulta. */
export interface SpendingTypicals {
  /** Por categoría, para marcar el gasto suelto que se sale. */
  readonly byCategory: readonly CategoryTypical[]
  /** Por tramo, para que el panel compare contra lo tuyo y no contra el mes pasado. */
  readonly byWindow: readonly WindowBaseline[]
}

/**
 * Un movimiento listo para apuntarse **o para esperar a que vuelva la red**.
 *
 * Sin nada del closure: esto puede quedarse encolado y salir mucho después
 * (ADR-0011). `values` ya es serializable tal cual sale del formulario.
 */
export interface CreateTransactionInput {
  /** Generado en el cliente: la pantalla ya enseñó el movimiento con este id. */
  readonly id: string
  readonly userId: string
  readonly values: TransactionValues
}

/**
 * Traduce el formulario a la fila de la base.
 *
 * **Limpia lo que no aplica al tipo**, y no es cortesía: la base exige que un
 * traspaso lleve cuenta destino y no lleve categoría, y que un gasto sea al
 * revés. Cambiar de tipo en el formulario arrastraría lo elegido antes y la
 * escritura se rechazaría con un error técnico.
 */
/**
 * Las partes tal y como van a la base.
 *
 * Un traspaso nunca lleva: cambia de cajón, no se gasta en nada. La base lo
 * rechaza también, y esto evita el viaje.
 */
function toSplitRows(transactionId: string, userId: string, values: TransactionValues) {
  if (values.kind === 'transfer') return []

  return values.splits.map((split) => ({
    transaction_id: transactionId,
    user_id: userId,
    category_id: split.categoryId,
    amount: split.amount,
  }))
}

/**
 * El error del trigger, dicho en cristiano.
 *
 * La base lanza un nombre corto y el texto se escribe aquí: una migración no es
 * sitio para redactar lo que lee el usuario, y el mismo fallo se cuenta distinto
 * según lo que estuviera haciendo.
 */
function toSplitError(error: unknown) {
  if (isRaisedError(error, 'splits_exceed_total')) {
    return createAppError(
      'validation',
      'Lo repartido no cabe en el total. Baja alguna parte o sube el monto.',
    )
  }

  if (isRaisedError(error, 'splits_on_transfer')) {
    return createAppError('validation', 'Un traspaso no se reparte entre categorías.')
  }

  return toAppError(error)
}

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
        transactions,
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

  /**
   * Cuánto sueles gastar: en cada categoría y en un tramo de cada tamaño.
   *
   * **Ciento ochenta días, y está medido.** Sobre los gastos reales, con noventa
   * hablan cuatro categorías y cubren 90 gastos; con ciento ochenta, seis y 133.
   * La mediana casi no se mueve entre una ventana y otra —Mercado da 155.300 con
   * las dos—, así que alargarla compra cobertura sin pagar frescura.
   *
   * Va en su propia consulta y no dentro de `getMonth`: el mes se mira mes a
   * mes y esto es una ventana móvil que no cambia al cambiar de mes, así que
   * comparten poco y se guardan aparte.
   */
  async getSpendingTypicals(userId: string, today: Date): Promise<SpendingTypicals> {
    try {
      const from = minusDays(today, TYPICAL_DAYS - 1)
      const transactions = await financeRepository.listTransactionsBetween(
        userId,
        toDateKey(from),
        toDateKey(today),
      )

      return {
        byCategory: categoryTypicals(transactions),
        // Solo los gastos: un sueldo al lado de una compra no dice nada de
        // ninguno de los dos.
        byWindow: windowBaselines(
          transactions
            .filter(({ kind }) => kind === 'expense')
            .map(({ occurred_on, amount }) => ({ date: occurred_on, value: amount })),
          today,
          COMPARABLE_WINDOWS,
        ),
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

  /**
   * Apunta un movimiento.
   *
   * Recibe el id ya puesto porque **un gasto se apunta en la calle**, donde
   * puede no haber señal: la pantalla lo enseña con ese id antes de que salga, y
   * reenviarlo —un reintento, dos pestañas— choca con la clave primaria en vez
   * de apuntar el gasto dos veces (ADR-0011).
   */
  async createTransaction(input: CreateTransactionInput): Promise<void> {
    try {
      await financeRepository.insertTransaction({
        id: input.id,
        user_id: input.userId,
        ...toTransactionRow(input.values),
      })

      // **El movimiento primero y las partes después, en ese orden.** Sin
      // transacciones desde el cliente, si falla lo segundo el dinero ya quedó
      // apuntado —que es lo que no se puede perder— y el reparto se vuelve a
      // hacer corrigiendo. Al revés se perdería el gasto por no haber podido
      // guardar un detalle suyo.
      await financeRepository.insertTransactionSplits(
        toSplitRows(input.id, input.userId, input.values),
      )
    } catch (error) {
      throw toSplitError(error)
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
  async updateTransaction(
    transactionId: string,
    userId: string,
    values: TransactionValues,
  ): Promise<void> {
    try {
      // **Los tres pasos van en este orden y no en otro.** La base no deja que
      // las partes pasen del total, así que bajar el total con las partes
      // viejas puestas se rechaza, y subir las partes antes de subir el total
      // también. Vaciarlas primero deja el camino libre en los dos sentidos.
      await financeRepository.deleteTransactionSplits(transactionId)
      await financeRepository.updateTransaction(transactionId, toTransactionRow(values))
      await financeRepository.insertTransactionSplits(toSplitRows(transactionId, userId, values))
    } catch (error) {
      throw toSplitError(error)
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
