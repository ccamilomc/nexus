import { supabase, type TablesInsert } from '@/core/supabase'

import type { SleepLog } from '../types/sleep.types'

/** Acceso a datos de sueño. Sólo habla con Supabase; sin reglas de negocio. */
export const sleepRepository = {
  /** Las últimas noches, de la más reciente a la más antigua. */
  async listRecentLogs(userId: string, limit: number): Promise<SleepLog[]> {
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data ?? []
  },

  /** El registro de una noche concreta, por su fecha (`YYYY-MM-DD`). */
  async findLogByDate(userId: string, dateKey: string): Promise<SleepLog | null> {
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateKey)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async insertLog(input: TablesInsert<'sleep_logs'>): Promise<SleepLog> {
    const { data, error } = await supabase.from('sleep_logs').insert(input).select('*').single()

    if (error) throw error
    return data
  },

  async updateLog(logId: string, patch: Partial<TablesInsert<'sleep_logs'>>): Promise<SleepLog> {
    const { data, error } = await supabase
      .from('sleep_logs')
      .update(patch)
      .eq('id', logId)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  /** Borrado lógico: el registro es sincronizable offline (ver docs/04). */
  async softDeleteLog(logId: string, deletedAtIso: string): Promise<void> {
    const { error } = await supabase
      .from('sleep_logs')
      .update({ deleted_at: deletedAtIso })
      .eq('id', logId)

    if (error) throw error
  },
}
