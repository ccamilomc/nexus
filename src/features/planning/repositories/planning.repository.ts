import { supabase, type TablesInsert } from '@/core/supabase'

import type { DismissedRow } from '../types/planning.types'

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
}
