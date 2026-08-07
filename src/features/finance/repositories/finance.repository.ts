import { supabase, type TablesInsert, type TablesUpdate } from '@/core/supabase'

import type {
  DebtPaymentRow,
  FinanceAccount,
  FinanceBudget,
  FinanceCategory,
  FinanceDebt,
  FinanceRecurring,
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
      // Las cuentas se incrustan **indicando la columna**: desde que existen los
      // traspasos hay dos claves foráneas hacia `finance_accounts` (origen y
      // destino) y sin la pista PostgREST no sabe cuál de las dos quieres.
      .select(
        '*, account:finance_accounts!account_id(name), toAccount:finance_accounts!counterpart_account_id(name), category:finance_categories(name)',
      )
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

  /** Las deudas vivas, de la más reciente a la más antigua. */
  async listDebts(userId: string): Promise<FinanceDebt[]> {
    const { data, error } = await supabase
      .from('finance_debts')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('started_on', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  /**
   * Los abonos de todas las deudas del usuario.
   *
   * Una consulta para todas y no una por deuda: la pantalla las enseña juntas,
   * y preguntar deuda por deuda serían tantos viajes como deudas haya.
   */
  async listDebtPayments(userId: string): Promise<DebtPaymentRow[]> {
    const { data, error } = await supabase
      .from('finance_transactions')
      .select('debt_id, amount, occurred_on')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .not('debt_id', 'is', null)

    if (error) throw error
    return data ?? []
  },

  /** Los topes mensuales del usuario. */
  async listBudgets(userId: string): Promise<FinanceBudget[]> {
    const { data, error } = await supabase.from('finance_budgets').select('*').eq('user_id', userId)

    if (error) throw error
    return data ?? []
  },

  /**
   * Pone o cambia el tope de una categoría.
   *
   * `upsert` sobre `(user_id, category_id)`: hay un único tope por categoría y
   * quien lo pone no tiene por qué saber si ya existía.
   */
  async upsertBudget(input: TablesInsert<'finance_budgets'>): Promise<void> {
    const { error } = await supabase
      .from('finance_budgets')
      .upsert(input, { onConflict: 'user_id,category_id' })

    if (error) throw error
  },

  /**
   * Quita el tope de una categoría, que vuelve a no tener límite.
   *
   * Borrado de verdad y no lógico: un tope es un ajuste, no el registro de algo
   * que ocurrió. No hay nada que conservar.
   */
  async deleteBudget(budgetId: string): Promise<void> {
    const { error } = await supabase.from('finance_budgets').delete().eq('id', budgetId)

    if (error) throw error
  },

  /** Los pagos fijos vivos, del que antes vence al que más tarda. */
  async listRecurring(userId: string): Promise<FinanceRecurring[]> {
    const { data, error } = await supabase
      .from('finance_recurring')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('next_due_on', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async insertRecurring(input: TablesInsert<'finance_recurring'>): Promise<FinanceRecurring> {
    const { data, error } = await supabase
      .from('finance_recurring')
      .insert(input)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  /** Mueve un fijo a su siguiente vencimiento, o lo pausa/reanuda. */
  async updateRecurring(
    recurringId: string,
    input: TablesUpdate<'finance_recurring'>,
  ): Promise<void> {
    const { error } = await supabase.from('finance_recurring').update(input).eq('id', recurringId)

    if (error) throw error
  },

  async softDeleteRecurring(recurringId: string): Promise<void> {
    const { error } = await supabase
      .from('finance_recurring')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', recurringId)

    if (error) throw error
  },

  async insertDebt(input: TablesInsert<'finance_debts'>): Promise<FinanceDebt> {
    const { data, error } = await supabase.from('finance_debts').insert(input).select('*').single()

    if (error) throw error
    return data
  },

  /**
   * Borrado lógico de una deuda apuntada por error.
   *
   * Los abonos que la señalaban se quedan: eran gastos de verdad y el dinero
   * salió igual. Lo dice el `on delete set null` de la columna, pero aquí ni
   * siquiera se llega a borrar la fila.
   */
  async softDeleteDebt(debtId: string): Promise<void> {
    const { error } = await supabase
      .from('finance_debts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', debtId)

    if (error) throw error
  },

  /** Marca una deuda como saldada, o la reabre. */
  async setDebtSettled(debtId: string, settledAt: string | null): Promise<void> {
    const { error } = await supabase
      .from('finance_debts')
      .update({ settled_at: settledAt })
      .eq('id', debtId)

    if (error) throw error
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

  async updateTransaction(
    transactionId: string,
    input: TablesUpdate<'finance_transactions'>,
  ): Promise<void> {
    const { error } = await supabase
      .from('finance_transactions')
      .update(input)
      .eq('id', transactionId)

    if (error) throw error
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
