import { describe, expect, it } from 'vitest'

import type { FoodRef, MealLog, MealLogItemWithFood, MealType } from '../types/nutrition.types'
import { buildDayNutrition } from './day-nutrition'

const TYPES: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

const EGG: FoodRef = {
  id: 'egg',
  name: 'Huevo',
  brand: null,
  serving_size: 50,
  serving_unit: 'g',
  calories: 72,
  protein_g: 6.3,
  carbs_g: 0.4,
  fat_g: 5,
}

function log(id: string, mealType: MealType): MealLog {
  return {
    id,
    user_id: 'user-1',
    meal_type: mealType,
    name: null,
    logged_at: '2026-07-25T12:00:00.000Z',
    created_at: '2026-07-25T12:00:00.000Z',
    updated_at: '2026-07-25T12:00:00.000Z',
    deleted_at: null,
  }
}

function item(id: string, mealLogId: string, servings: number): MealLogItemWithFood {
  return {
    id,
    meal_log_id: mealLogId,
    food_id: EGG.id,
    servings,
    created_at: '2026-07-25T12:00:00.000Z',
    updated_at: '2026-07-25T12:00:00.000Z',
    food: EGG,
  }
}

describe('buildDayNutrition', () => {
  it('siempre devuelve las cuatro comidas, aunque el día esté vacío', () => {
    const day = buildDayNutrition(TYPES, [], [])

    expect(day.meals.map((meal) => meal.mealType)).toEqual(TYPES)
    expect(day.meals.every((meal) => meal.log === null && meal.items.length === 0)).toBe(true)
    expect(day.totals.calories).toBe(0)
  })

  it('coloca cada alimento bajo su comida', () => {
    const day = buildDayNutrition(
      TYPES,
      [log('l1', 'breakfast'), log('l2', 'dinner')],
      [item('i1', 'l1', 2), item('i2', 'l2', 1)],
    )

    const breakfast = day.meals.find((meal) => meal.mealType === 'breakfast')
    const dinner = day.meals.find((meal) => meal.mealType === 'dinner')

    expect(breakfast?.items).toHaveLength(1)
    expect(breakfast?.macros.calories).toBe(144)
    expect(dinner?.macros.calories).toBe(72)
  })

  it('totaliza el día sumando todas las comidas', () => {
    const day = buildDayNutrition(
      TYPES,
      [log('l1', 'breakfast'), log('l2', 'dinner')],
      [item('i1', 'l1', 2), item('i2', 'l2', 1)],
    )

    expect(day.totals.calories).toBe(216)
    expect(day.totals.proteinG).toBe(18.9)
  })

  it('junta los alimentos si hay dos comidas del mismo tipo, sin perder ninguno', () => {
    const day = buildDayNutrition(
      TYPES,
      [log('l1', 'lunch'), log('l2', 'lunch')],
      [item('i1', 'l1', 1), item('i2', 'l2', 1)],
    )

    const lunch = day.meals.find((meal) => meal.mealType === 'lunch')

    expect(lunch?.items).toHaveLength(2)
    expect(lunch?.macros.calories).toBe(144)
  })

  it('ignora los alimentos de comidas que no son del día', () => {
    const day = buildDayNutrition(TYPES, [log('l1', 'lunch')], [item('i1', 'otro-dia', 5)])

    expect(day.totals.calories).toBe(0)
  })
})
