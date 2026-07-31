import { supabase, type TablesInsert, type TablesUpdate } from '@/core/supabase'

import type {
  Food,
  MealLog,
  MealLogItem,
  MealLogItemWithFood,
  MealType,
  NutritionGoal,
  WaterLog,
} from '../types/nutrition.types'

/** Alimento con lo que la interfaz necesita para calcular y mostrar macros. */
const FOOD_FIELDS =
  'id, name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, cost_per_serving'

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

  async insertFood(input: TablesInsert<'foods'>): Promise<Food> {
    const { data, error } = await supabase.from('foods').insert(input).select('*').single()

    if (error) throw error
    return data
  },

  async updateFood(foodId: string, patch: TablesUpdate<'foods'>): Promise<Food> {
    const { data, error } = await supabase
      .from('foods')
      .update(patch)
      .eq('id', foodId)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  async deleteFood(foodId: string): Promise<void> {
    const { error } = await supabase.from('foods').delete().eq('id', foodId)

    if (error) throw error
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

  /**
   * Comidas de días anteriores, de la más reciente a la más antigua.
   *
   * Se piden **todos los tipos de una vez** (no una consulta por comida) porque
   * la pantalla del día necesita saber qué puede repetir en las cuatro.
   */
  async listRecentMealLogs(
    userId: string,
    sinceIso: string,
    beforeIso: string,
    limit: number,
  ): Promise<MealLog[]> {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('logged_at', sinceIso)
      .lt('logged_at', beforeIso)
      .order('logged_at', { ascending: false })
      .limit(limit)

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

  async findActiveGoal(userId: string): Promise<NutritionGoal | null> {
    const { data, error } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data
  },

  /** Jubila los objetivos vigentes: el historial se conserva (ver docs/04). */
  async deactivateGoals(userId: string): Promise<void> {
    const { error } = await supabase
      .from('nutrition_goals')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) throw error
  },

  async insertGoal(input: TablesInsert<'nutrition_goals'>): Promise<NutritionGoal> {
    const { data, error } = await supabase
      .from('nutrition_goals')
      .insert(input)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  /** Registros de agua dentro de un rango (el día local, en la práctica). */
  async listWaterLogsBetween(userId: string, fromIso: string, toIso: string): Promise<WaterLog[]> {
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('logged_at', fromIso)
      .lt('logged_at', toIso)
      .order('logged_at', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async insertWaterLog(userId: string, amountMl: number, loggedAtIso: string): Promise<WaterLog> {
    const { data, error } = await supabase
      .from('water_logs')
      .insert({ user_id: userId, amount_ml: amountMl, logged_at: loggedAtIso })
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  async softDeleteWaterLog(waterLogId: string, deletedAtIso: string): Promise<void> {
    const { error } = await supabase
      .from('water_logs')
      .update({ deleted_at: deletedAtIso })
      .eq('id', waterLogId)

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
