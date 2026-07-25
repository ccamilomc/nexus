import { describe, expect, it } from 'vitest'

import type { FoodRef, MealLogItemWithFood } from '../types/nutrition.types'
import { EMPTY_MACROS, macrosForItems, macrosForServings, sumMacros } from './macros'

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

const RICE: FoodRef = {
  id: 'rice',
  name: 'Arroz blanco cocido',
  brand: null,
  serving_size: 100,
  serving_unit: 'g',
  calories: 130,
  protein_g: 2.7,
  carbs_g: 28,
  fat_g: 0.3,
}

function item(food: FoodRef, servings: number): MealLogItemWithFood {
  return {
    id: `item-${food.id}-${servings}`,
    meal_log_id: 'log-1',
    food_id: food.id,
    servings,
    created_at: '2026-07-25T12:00:00.000Z',
    updated_at: '2026-07-25T12:00:00.000Z',
    food,
  }
}

describe('macrosForServings', () => {
  it('multiplica la porción del alimento, no gramos sueltos', () => {
    expect(macrosForServings(EGG, 2)).toEqual({
      calories: 144,
      proteinG: 12.6,
      carbsG: 0.8,
      fatG: 10,
    })
  })

  it('admite porciones fraccionadas', () => {
    expect(macrosForServings(RICE, 1.5)).toEqual({
      calories: 195,
      proteinG: 4.05,
      carbsG: 42,
      fatG: 0.45,
    })
  })

  it('devuelve ceros con cero porciones', () => {
    expect(macrosForServings(EGG, 0)).toEqual(EMPTY_MACROS)
  })
})

describe('sumMacros', () => {
  it('suma sin arrastrar ruido de coma flotante', () => {
    const total = sumMacros([
      { calories: 0, proteinG: 0.1, carbsG: 0, fatG: 0 },
      { calories: 0, proteinG: 0.2, carbsG: 0, fatG: 0 },
    ])

    expect(total.proteinG).toBe(0.3)
  })

  it('una lista vacía suma cero', () => {
    expect(sumMacros([])).toEqual(EMPTY_MACROS)
  })
})

describe('macrosForItems', () => {
  it('suma los alimentos de una comida', () => {
    const macros = macrosForItems([item(EGG, 2), item(RICE, 1)])

    expect(macros).toEqual({
      calories: 274,
      proteinG: 15.3,
      carbsG: 28.8,
      fatG: 10.3,
    })
  })

  it('una comida sin alimentos no aporta macros', () => {
    expect(macrosForItems([])).toEqual(EMPTY_MACROS)
  })
})
