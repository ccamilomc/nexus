import { describe, expect, it } from 'vitest'

import type { FoodRef, MealLogItemWithFood } from '../types/nutrition.types'
import { calculateSpend } from './spend'

function food(id: string, costPerServing: number | null): FoodRef {
  return {
    id,
    name: `Alimento ${id}`,
    brand: null,
    serving_size: 100,
    serving_unit: 'g',
    calories: 100,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    cost_per_serving: costPerServing,
  }
}

function item(id: string, costPerServing: number | null, servings: number): MealLogItemWithFood {
  return {
    id,
    meal_log_id: 'log-1',
    food_id: id,
    servings,
    created_at: '2026-07-25T12:00:00.000Z',
    updated_at: '2026-07-25T12:00:00.000Z',
    food: food(id, costPerServing),
  }
}

describe('calculateSpend', () => {
  it('multiplica el precio por las porciones', () => {
    const spend = calculateSpend([item('a', 12000, 2)])

    expect(spend.totalCop).toBe(24000)
    expect(spend.itemsWithPrice).toBe(1)
  })

  it('suma varios alimentos', () => {
    const spend = calculateSpend([item('a', 12000, 1), item('b', 3500, 2)])

    expect(spend.totalCop).toBe(19000)
  })

  it('cuenta los alimentos sin precio en vez de contarlos como gratis', () => {
    const spend = calculateSpend([item('a', 12000, 1), item('b', null, 1)])

    expect(spend.totalCop).toBe(12000)
    expect(spend.itemsWithoutPrice).toBe(1)
    expect(spend.itemsWithPrice).toBe(1)
  })

  it('redondea al peso: el COP no tiene centavos', () => {
    const spend = calculateSpend([item('a', 3333, 1.5)])

    expect(spend.totalCop).toBe(5000)
    expect(Number.isInteger(spend.totalCop)).toBe(true)
  })

  it('una semana sin registros no gastó nada', () => {
    const spend = calculateSpend([])

    expect(spend).toEqual({ totalCop: 0, itemsWithoutPrice: 0, itemsWithPrice: 0 })
  })
})
