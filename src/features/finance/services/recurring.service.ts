import { toAppError } from '@/core/error'
import { toDateKey } from '@/shared/utils'

import { financeRepository } from '../repositories/finance.repository'
import type { RecurringValues } from '../schemas/finance.schema'
import type { FinanceRecurring, RecurringWithStatus } from '../types/finance.types'
import { daysUntil, nextDueDate } from '../utils/recurrence'

/** Traduce el formulario de un pago fijo a la fila de la base. */
function toRecurringRow(values: RecurringValues) {
  return {
    name: values.name,
    kind: values.kind,
    amount: values.amount,
    account_id: values.accountId,
    category_id: values.categoryId,
    frequency: values.frequency,
    next_due_on: values.nextDueOn,
    note: values.note?.trim() ? values.note.trim() : null,
  }
}

/** El día del mes de una clave `YYYY-MM-DD`. */
function dayOf(dateKey: string): number {
  const [, , day = 1] = dateKey.split('-').map(Number)
  return day
}

/**
 * Los pagos fijos: lo que se repite sin que haya que pensarlo.
 *
 * **Nexus no los apunta solo.** Enseña los que tocan y se confirman de un toque:
 * un gimnasio se cancela, un cobro falla, un mes se paga distinto. Apuntar un
 * movimiento que el usuario no hizo sería inventarle datos.
 */
export const recurringService = {
  /** Los pagos fijos con su estado: cuántos días faltan y si ya toca. */
  async getRecurring(userId: string, today: Date): Promise<RecurringWithStatus[]> {
    try {
      const items = await financeRepository.listRecurring(userId)
      const todayKey = toDateKey(today)

      return items.map((recurring) => {
        const daysLeft = daysUntil(recurring.next_due_on, todayKey)

        return {
          recurring,
          daysLeft,
          // Un fijo pausado no vence: se dejó a propósito y avisar de él sería
          // ruido sobre algo que el usuario ya decidió.
          isDue: recurring.paused_at === null && daysLeft <= 0,
        }
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  async createRecurring(userId: string, values: RecurringValues): Promise<FinanceRecurring> {
    try {
      return await financeRepository.insertRecurring({
        user_id: userId,
        ...toRecurringRow(values),
        // El día acordado sale del primer vencimiento. Guardarlo aparte es lo
        // que evita que un fijo del 31 se quede en el 28 tras pasar por febrero.
        anchor_day: dayOf(values.nextDueOn),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Corrige un pago fijo ya apuntado: sube el arriendo, cambia la cuenta.
   *
   * **El día acordado sólo se rehace si la fecha cambió**, y ahí está todo el
   * cuidado de esta función. Un arriendo del 31 que pasó por febrero tiene su
   * próximo vencimiento en el 28; recalcular `anchor_day` desde esa fecha al
   * editar únicamente el monto lo dejaría anclado al 28 **para siempre**, que es
   * exactamente el fallo que `anchor_day` vino a resolver.
   *
   * Los movimientos que ya confirmó no se tocan: el arriendo de julio se pagó a
   * lo que costaba en julio, y reescribirlo cambiaría un gasto que sí ocurrió.
   */
  async updateRecurring(
    recurringId: string,
    values: RecurringValues,
    currentNextDueOn: string,
  ): Promise<void> {
    try {
      const hasMovedDate = values.nextDueOn !== currentNextDueOn

      await financeRepository.updateRecurring(recurringId, {
        ...toRecurringRow(values),
        ...(hasMovedDate ? { anchor_day: dayOf(values.nextDueOn) } : {}),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Confirma que un pago fijo ocurrió: lo apunta y lo mueve al siguiente.
   *
   * **Las dos cosas o ninguna sería lo ideal**, pero Supabase no da
   * transacciones desde el cliente. Se apunta primero el movimiento y sólo
   * después se avanza la fecha: si falla lo segundo, el fijo vuelve a ofrecerse
   * y el usuario ve un gasto duplicado que puede quitar. Al revés se perdería un
   * pago sin rastro, que es peor.
   */
  async confirmRecurring(
    userId: string,
    item: FinanceRecurring,
    occurredOn: string,
  ): Promise<void> {
    try {
      await financeRepository.insertTransaction({
        user_id: userId,
        account_id: item.account_id,
        category_id: item.category_id,
        recurring_id: item.id,
        kind: item.kind,
        amount: item.amount,
        occurred_on: occurredOn,
        note: item.name,
      })

      await financeRepository.updateRecurring(item.id, {
        next_due_on: nextDueDate(item.next_due_on, item.frequency, item.anchor_day),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Pausa un fijo o lo reanuda. Pausado no vence ni avisa. */
  async setRecurringPaused(recurringId: string, isPaused: boolean): Promise<void> {
    try {
      await financeRepository.updateRecurring(recurringId, {
        paused_at: isPaused ? new Date().toISOString() : null,
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  async removeRecurring(recurringId: string): Promise<void> {
    try {
      await financeRepository.softDeleteRecurring(recurringId)
    } catch (error) {
      throw toAppError(error)
    }
  },
}
