import { supabase, type TablesInsert, type TablesUpdate } from '@/core/supabase'

import type { DailyPlanRow, DismissedRow, PlanItem } from '../types/planning.types'

/** Acceso a datos del plan. Sólo habla con Supabase; sin reglas de negocio. */
export const planningRepository = {
  /**
   * Las recomendaciones descartadas que siguen vigentes.
   *
   * Se filtra por `valid_until` en la propia consulta: un descarte caduca solo
   * al acabar el día, sin necesidad de limpiar nada por la noche.
   */
  async listDismissed(userId: string, nowIso: string): Promise<DismissedRow[]> {
    const { data, error } = await supabase
      .from('recommendations')
      .select('id, data')
      .eq('user_id', userId)
      .eq('status', 'dismissed')
      .is('deleted_at', null)
      .gt('valid_until', nowIso)

    if (error) throw error
    return data ?? []
  },

  async insertDismissed(input: TablesInsert<'recommendations'>): Promise<void> {
    const { error } = await supabase.from('recommendations').insert(input)

    if (error) throw error
  },

  // ─── Plan del día ───────────────────────────────────────────────────────
  /** El plan de una fecha (`YYYY-MM-DD`); `null` si aún no existe. */
  async findPlan(userId: string, dateKey: string): Promise<DailyPlanRow | null> {
    const { data, error } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateKey)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async insertPlan(userId: string, dateKey: string): Promise<DailyPlanRow> {
    const { data, error } = await supabase
      .from('daily_plans')
      .insert({ user_id: userId, date: dateKey, status: 'active' })
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  /**
   * Los ítems de un plan, por hora y luego por orden.
   *
   * Los que no tienen hora quedan al final: son cosas del día sin momento
   * fijado, no cosas de medianoche.
   */
  async listItems(planId: string): Promise<PlanItem[]> {
    const { data, error } = await supabase
      .from('plan_items')
      .select('*')
      .eq('daily_plan_id', planId)
      .is('deleted_at', null)
      .order('scheduled_start', { ascending: true, nullsFirst: false })
      .order('order_index', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async insertItem(input: TablesInsert<'plan_items'>): Promise<PlanItem> {
    const { data, error } = await supabase.from('plan_items').insert(input).select('*').single()

    if (error) throw error
    return data
  },

  async updateItem(itemId: string, patch: TablesUpdate<'plan_items'>): Promise<void> {
    const { error } = await supabase.from('plan_items').update(patch).eq('id', itemId)

    if (error) throw error
  },

  /** Borrado lógico: el ítem es sincronizable offline (ver docs/04). */
  async softDeleteItem(itemId: string, deletedAtIso: string): Promise<void> {
    const { error } = await supabase
      .from('plan_items')
      .update({ deleted_at: deletedAtIso })
      .eq('id', itemId)

    if (error) throw error
  },
}
