import { supabase, type TablesInsert } from '@/core/supabase'

import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
  FinanceTransactionWithNames,
} from '../types/finance.types'

/** Acceso a datos de finanzas. Sólo habla con Supabase; sin reglas de negocio. */
export const financeRepository = {
  /** Las cuentas vivas del usuario, en el orden en que las creó. */
  async listAccounts(userId: string): Promise<FinanceAccount[]> {
    const { data, error } = await supabase
      .from('finance_accounts')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .is('archived_at', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  /**
   * Las categorías disponibles: las globales del catálogo y las propias.
   *
   * La RLS ya decide cuáles se ven; aquí no hace falta filtrar por usuario.
   */
  async listCategories(): Promise<FinanceCategory[]> {
    const { data, error } = await supabase
      .from('finance_categories')
      .select('*')
      .is('archived_at', null)
      .order('name', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  /**
   * Los movimientos de un tramo de fechas, del más reciente al más antiguo.
   *
   * Trae el nombre de la cuenta y de la categoría en la misma consulta: una
   * lista de gastos sin el nombre de la categoría no dice nada, y resolverlos
   * después serían dos viajes más.
   */
  async listTransactionsBetween(
    userId: string,
    fromDateKey: string,
    toDateKey: string,
  ): Promise<FinanceTransactionWithNames[]> {
    const { data, error } = await supabase
      .from('finance_transactions')
      .select('*, account:finance_accounts(name), category:finance_categories(name)')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('occurred_on', fromDateKey)
      .lte('occurred_on', toDateKey)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async insertAccount(input: TablesInsert<'finance_accounts'>): Promise<FinanceAccount> {
    const { data, error } = await supabase
      .from('finance_accounts')
      .insert(input)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  async insertCategory(input: TablesInsert<'finance_categories'>): Promise<FinanceCategory> {
    const { data, error } = await supabase
      .from('finance_categories')
      .insert(input)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  /**
   * Archivar, no borrar.
   *
   * Una categoría borrada dejaría sin clasificar los movimientos que la usaban;
   * archivada desaparece de los formularios y el histórico sigue contando la
   * verdad. Lo mismo con las cuentas.
   */
  async archiveCategory(categoryId: string): Promise<void> {
    const { error } = await supabase
      .from('finance_categories')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', categoryId)

    if (error) throw error
  },

  async archiveAccount(accountId: string): Promise<void> {
    const { error } = await supabase
      .from('finance_accounts')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', accountId)

    if (error) throw error
  },

  async insertTransaction(
    input: TablesInsert<'finance_transactions'>,
  ): Promise<FinanceTransaction> {
    const { data, error } = await supabase
      .from('finance_transactions')
      .insert(input)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  /** Borrado lógico: el histórico no se pierde y la sincronización lo entiende. */
  async softDeleteTransaction(transactionId: string): Promise<void> {
    const { error } = await supabase
      .from('finance_transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', transactionId)

    if (error) throw error
  },
}
