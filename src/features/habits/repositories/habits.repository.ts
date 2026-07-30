import { supabase, type TablesInsert, type TablesUpdate } from '@/core/supabase'

import type { Habit, HabitLog } from '../types/habits.types'

/** Acceso a datos de hábitos. Sólo habla con Supabase; sin reglas de negocio. */
export const habitsRepository = {
  async listHabits(userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .is('archived_at', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  /** Los archivados, del último retirado al primero. */
  async listArchivedHabits(userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async insertHabit(input: TablesInsert<'habits'>): Promise<Habit> {
    const { data, error } = await supabase.from('habits').insert(input).select('*').single()

    if (error) throw error
    return data
  },

  async updateHabit(habitId: string, patch: TablesUpdate<'habits'>): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .update(patch)
      .eq('id', habitId)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  /** Registros entre dos fechas (`YYYY-MM-DD`), ambas incluidas. */
  async listLogsBetween(userId: string, fromKey: string, toKey: string): Promise<HabitLog[]> {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('date', fromKey)
      .lte('date', toKey)

    if (error) throw error
    return data ?? []
  },

  async insertLog(input: TablesInsert<'habit_logs'>): Promise<HabitLog> {
    const { data, error } = await supabase.from('habit_logs').insert(input).select('*').single()

    if (error) throw error
    return data
  },

  /**
   * Borra el registro de un hábito en una fecha.
   *
   * Borrado real, no lógico: hay un índice único sobre (habit_id, date) que
   * sólo mira las filas vivas, así que dejar tumbas impediría volver a marcar
   * ese mismo día. Desmarcar es «no pasó», no «pasó y se borró».
   */
  async deleteLog(habitId: string, dateKey: string): Promise<void> {
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('date', dateKey)

    if (error) throw error
  },
}
