import { toAppError } from '@/core/error'

import { financeRepository } from '../repositories/finance.repository'
import type { AccountValues, CategoryValues } from '../schemas/finance.schema'
import type { FinanceAccount, FinanceCategory } from '../types/finance.types'

/**
 * Cuentas y categorías: los cajones y las etiquetas.
 *
 * Van juntas porque son lo mismo desde el punto de vista del usuario —cosas que
 * se crean una vez y luego sólo se eligen en un desplegable— y porque las dos se
 * retiran en vez de borrarse, para no romper el histórico que las señala.
 */
export const catalogService = {
  async getAccounts(userId: string): Promise<FinanceAccount[]> {
    try {
      return await financeRepository.listAccounts(userId)
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

  async archiveAccount(accountId: string): Promise<void> {
    try {
      await financeRepository.archiveAccount(accountId)
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
}
