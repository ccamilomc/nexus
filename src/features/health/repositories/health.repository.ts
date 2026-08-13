import { supabase, type TablesInsert } from '@/core/supabase'

import type { BodyMetric, BodyMetricType } from '../types/health.types'

/** Acceso a datos de salud. Sólo habla con Supabase; sin reglas de negocio. */
export const healthRepository = {
  /** Últimas mediciones de todas las medidas, de la más reciente a la más antigua. */
  async listRecentMetrics(userId: string, limit: number): Promise<BodyMetric[]> {
    const { data, error } = await supabase
      .from('body_metrics')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('measured_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data ?? []
  },

  /** Las mediciones de una medida dentro de un rango, de la más antigua a la más nueva. */
  async listMetricsBetween(
    userId: string,
    metricType: BodyMetricType,
    fromIso: string,
    toIso: string,
  ): Promise<BodyMetric[]> {
    const { data, error } = await supabase
      .from('body_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('metric_type', metricType)
      .is('deleted_at', null)
      .gte('measured_at', fromIso)
      .lt('measured_at', toIso)
      .order('measured_at', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async insertMetric(input: TablesInsert<'body_metrics'>): Promise<BodyMetric> {
    const { data, error } = await supabase.from('body_metrics').insert(input).select('*').single()

    if (error) throw error
    return data
  },

  /** Borrado lógico: la medición es sincronizable offline (ver docs/04). */
  async softDeleteMetric(metricId: string, deletedAtIso: string): Promise<void> {
    const { error } = await supabase
      .from('body_metrics')
      .update({ deleted_at: deletedAtIso })
      .eq('id', metricId)

    if (error) throw error
  },

  /** Altura del perfil, en centímetros. Hace falta para el IMC. */
  async findHeightCm(userId: string): Promise<number | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('height_cm')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    return data?.height_cm ?? null
  },

  async updateHeightCm(userId: string, heightCm: number): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ height_cm: heightCm })
      .eq('id', userId)

    if (error) throw error
  },
}
