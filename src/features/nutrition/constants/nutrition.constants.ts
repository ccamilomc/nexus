import { Constants } from '@/core/supabase/database.types'

import type { MealType } from '../types/nutrition.types'

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snack',
}

/**
 * Orden en que se muestran las comidas: el del día, no el del enum.
 *
 * Se valida contra `Constants` para que añadir un tipo en la base obligue a
 * decidir dónde va en la pantalla, en vez de que desaparezca en silencio.
 */
export const MEAL_TYPES_IN_ORDER: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export const ALL_MEAL_TYPES: readonly MealType[] = Constants.public.Enums.meal_type
