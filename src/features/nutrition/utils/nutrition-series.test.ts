import { describe, expect, it } from 'vitest'

import type { FoodRef, MealLog, MealLogItemWithFood, WaterLog } from '../types/nutrition.types'
import { buildNutritionSeries } from './nutrition-series'

const DAYS = [new Date(2026, 6, 27), new Date(2026, 6, 28), new Date(2026, 6, 29)]
const PREVIOUS_DAYS = [new Date(2026, 6, 24), new Date(2026, 6, 25), new Date(2026, 6, 26)]

function food(calories: number, costPerServing: number | null): FoodRef {
  return {
    id: `f-${calories}-${costPerServing ?? 'x'}`,
    name: 'Alimento',
    brand: null,
    serving_size: 100,
    serving_unit: 'g',
    calories,
    protein_g: 10,
    carbs_g: 20,
    fat_g: 5,
    cost_per_serving: costPerServing,
  }
}

function mealLog(id: string, day: Date): MealLog {
  const at = new Date(day)
  at.setHours(13, 0, 0, 0)

  return {
    id,
    user_id: 'u1',
    meal_type: 'lunch',
    logged_at: at.toISOString(),
    name: null,
    created_at: at.toISOString(),
    updated_at: at.toISOString(),
    deleted_at: null,
  }
}

function item(logId: string, itemFood: FoodRef, servings = 1): MealLogItemWithFood {
  return {
    id: `${logId}-${itemFood.id}`,
    meal_log_id: logId,
    food_id: itemFood.id,
    servings,
    created_at: '2026-07-27T13:00:00.000Z',
    updated_at: '2026-07-27T13:00:00.000Z',
    food: itemFood,
  }
}

function water(day: Date, ml: number): WaterLog {
  const at = new Date(day)
  at.setHours(10, 0, 0, 0)

  return {
    id: `w-${day.getDate()}-${ml}`,
    user_id: 'u1',
    amount_ml: ml,
    logged_at: at.toISOString(),
    created_at: at.toISOString(),
    updated_at: at.toISOString(),
    deleted_at: null,
  }
}

describe('buildNutritionSeries', () => {
  it('suma las calorías de cada día', () => {
    const logs = [mealLog('m1', DAYS[0] as Date), mealLog('m2', DAYS[2] as Date)]
    const items = [item('m1', food(500, null)), item('m2', food(700, null))]

    const series = buildNutritionSeries(logs, items, [], DAYS, [])

    expect(series.caloriePoints).toEqual([
      { dateKey: '2026-07-27', value: 500 },
      { dateKey: '2026-07-28', value: null },
      { dateKey: '2026-07-29', value: 700 },
    ])
  })

  it('un día sin registrar es un hueco, no cero calorías', () => {
    // Nadie come cero. Contarlo como cero hundiría la media hasta la mentira.
    const series = buildNutritionSeries([], [], [], DAYS, [])

    expect(series.caloriePoints.every(({ value }) => value === null)).toBe(true)
    expect(series.averageCalories).toBeNull()
    expect(series.daysLogged).toBe(0)
  })

  it('la media sale de los días registrados', () => {
    const logs = [mealLog('m1', DAYS[0] as Date), mealLog('m2', DAYS[2] as Date)]
    const items = [item('m1', food(500, null)), item('m2', food(700, null))]

    expect(buildNutritionSeries(logs, items, [], DAYS, []).averageCalories).toBe(600)
  })

  it('una comida vacía no cuenta como día registrado', () => {
    const series = buildNutritionSeries([mealLog('m1', DAYS[0] as Date)], [], [], DAYS, [])

    expect(series.daysLogged).toBe(0)
    expect(series.caloriePoints[0]?.value).toBeNull()
  })

  it('las porciones multiplican las calorías', () => {
    const series = buildNutritionSeries(
      [mealLog('m1', DAYS[0] as Date)],
      [item('m1', food(250, null), 2)],
      [],
      DAYS,
      [],
    )

    expect(series.caloriePoints[0]?.value).toBe(500)
  })

  it('suma el gasto y avisa de los alimentos sin precio', () => {
    // El precio es opcional: el total puede ser parcial y hay que poder decirlo.
    const series = buildNutritionSeries(
      [mealLog('m1', DAYS[0] as Date)],
      [item('m1', food(300, 4500)), item('m1', food(200, null))],
      [],
      DAYS,
      [],
    )

    expect(series.spend.totalCop).toBe(4500)
    expect(series.spend.itemsWithoutPrice).toBe(1)
  })

  it('promedia el agua de los días con registro', () => {
    const series = buildNutritionSeries(
      [],
      [],
      [water(DAYS[0] as Date, 500), water(DAYS[0] as Date, 250), water(DAYS[2] as Date, 750)],
      DAYS,
      [],
    )

    expect(series.averageWaterMl).toBe(750)
  })

  it('separa el tramo anterior del actual', () => {
    const logs = [mealLog('viejo', PREVIOUS_DAYS[0] as Date), mealLog('nuevo', DAYS[0] as Date)]
    const items = [item('viejo', food(400, 3000)), item('nuevo', food(800, 5000))]

    const series = buildNutritionSeries(logs, items, [], DAYS, PREVIOUS_DAYS)

    expect(series.averageCalories).toBe(800)
    expect(series.previousAverageCalories).toBe(400)
    expect(series.spend.totalCop).toBe(5000)
    expect(series.previousSpendCop).toBe(3000)
  })
})
