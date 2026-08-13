import { toAppError } from '@/core/error'
import { toDateKey } from '@/shared/utils'

import { financeRepository } from '../repositories/finance.repository'
import type { DebtValues } from '../schemas/finance.schema'
import type { DebtPayment, DebtWithBalance, FinanceDebt } from '../types/finance.types'
import { calculateDebtBalance } from '../utils/debt-balance'

/** Traduce el formulario de una deuda a la fila de la base. */
function toDebtRow(values: DebtValues) {
  return {
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
  }
}

/**
 * Lo que debes y lo que te deben.
 *
 * **El saldo y los intereses nunca se guardan: se calculan** a partir del monto,
 * la tasa y los abonos. Por eso corregir una deuda los rehace solos, y por eso
 * no hay ningún método aquí que «actualice el saldo».
 */
export const debtsService = {
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
      return await financeRepository.insertDebt({ user_id: userId, ...toDebtRow(values) })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Corrige una deuda ya apuntada.
   *
   * **Se corrige en vez de borrarla y rehacerla**, y la diferencia no es de
   * comodidad: los abonos son movimientos con `debt_id`, así que borrar la deuda
   * los desvincula todos. Quien se equivocó en un cero tendría que elegir entre
   * dejar la cifra mal o perder el rastro de lo que ya pagó.
   */
  async updateDebt(debtId: string, values: DebtValues): Promise<void> {
    try {
      await financeRepository.updateDebt(debtId, toDebtRow(values))
    } catch (error) {
      throw toAppError(error)
    }
  },

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

  /**
   * Da una deuda por saldada, o la reabre.
   *
   * **Se marca a mano y no cuando los abonos cubren el monto.** Que las cuentas
   * cuadren no siempre significa que la otra persona la dé por cerrada, y
   * cerrarla sola dejaría de contar intereses de algo que sigue vivo.
   */
  async setDebtSettled(debtId: string, isSettled: boolean): Promise<void> {
    try {
      await financeRepository.setDebtSettled(debtId, isSettled ? new Date().toISOString() : null)
    } catch (error) {
      throw toAppError(error)
    }
  },
}
