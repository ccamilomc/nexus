import { supabase, type TablesInsert } from '@/core/supabase'

import type {
  Food,
  MealLog,
  MealLogItem,
  MealLogItemWithFood,
  MealType,
} from '../types/nutrition.types'

/** Alimento con lo que la interfaz necesita para calcular y mostrar macros. */
const FOOD_FIELDS =
  'id, name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g'

/** Acceso a datos de nutrición. Sólo habla con Supabase; sin reglas de negocio. */
export const nutritionRepository = {
  async listFoods(): Promise<Food[]> {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  /** Comidas registradas dentro de un rango (el día local, en la práctica). */
  async listMealLogsBetween(userId: string, fromIso: string, toIso: string): Promise<MealLog[]> {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('logged_at', fromIso)
      .lt('logged_at', toIso)
      .order('logged_at', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async listItemsByMealLogs(mealLogIds: readonly string[]): Promise<MealLogItemWithFood[]> {
    if (mealLogIds.length === 0) return []

    const { data, error } = await supabase
      .from('meal_log_items')
      .select(`*, food:foods(${FOOD_FIELDS})`)
      .in('meal_log_id', mealLogIds)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async insertMealLog(userId: string, mealType: MealType, loggedAtIso: string): Promise<MealLog> {
    const { data, error } = await supabase
      .from('meal_logs')
      .insert({ user_id: userId, meal_type: mealType, logged_at: loggedAtIso })
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  async insertMealLogItem(input: TablesInsert<'meal_log_items'>): Promise<MealLogItem> {
    const { data, error } = await supabase.from('meal_log_items').insert(input).select('*').single()

    if (error) throw error
    return data
  },

  async deleteMealLogItem(itemId: string): Promise<void> {
    const { error } = await supabase.from('meal_log_items').delete().eq('id', itemId)

    if (error) throw error
  },

  /** Borrado lógico: la comida es sincronizable offline (ver docs/04). */
  async softDeleteMealLog(mealLogId: string, deletedAtIso: string): Promise<void> {
    const { error } = await supabase
      .from('meal_logs')
      .update({ deleted_at: deletedAtIso })
      .eq('id', mealLogId)

    if (error) throw error
  },
}
