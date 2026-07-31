import { Constants } from '@/core/supabase/database.types'

import type { MealType } from '../types/nutrition.types'

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snack',
}

/**
 * Artículo de cada comida, para redactar frases naturales.
 *
 * «Repetir **el** cena» delata que la frase se armó pegando trozos; en un
 * producto en español el género no es un detalle opcional.
 */
export const MEAL_TYPE_ARTICLES: Record<MealType, string> = {
  breakfast: 'el',
  lunch: 'el',
  dinner: 'la',
  snack: 'el',
}

/**
 * Orden en que se muestran las comidas: el del día, no el del enum.
 *
 * Se valida contra `Constants` para que añadir un tipo en la base obligue a
 * decidir dónde va en la pantalla, en vez de que desaparezca en silencio.
 */
export const MEAL_TYPES_IN_ORDER: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export const ALL_MEAL_TYPES: readonly MealType[] = Constants.public.Enums.meal_type

export interface WaterQuickAmount {
  readonly ml: number
  readonly label: string
}

/**
 * Atajos para registrar agua de un toque.
 *
 * Beber es la acción más repetida del día: si hay que escribir una cantidad
 * cada vez, se deja de registrar. Estas son las medidas reales de un vaso y
 * de una botella.
 */
export const WATER_QUICK_AMOUNTS: readonly WaterQuickAmount[] = [
  { ml: 250, label: 'Vaso' },
  { ml: 500, label: 'Botella' },
]
