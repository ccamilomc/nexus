import { describe, expect, it } from 'vitest'

import type { FoodRef, MealLog, MealLogItemWithFood, MealType } from '../types/nutrition.types'
import { buildRepeatableMeals } from './repeatable-meals'

const TIPOS: readonly MealType[] = ['breakfast', 'lunch']

function food(id: string): FoodRef {
  return {
    id,
    name: id,
    brand: null,
    serving_size: 100,
    serving_unit: 'g',
    calories: 100,
    protein_g: 10,
    carbs_g: 5,
    fat_g: 2,
    cost_per_serving: null,
  }
}

/** Una comida del tipo indicado; `at` ordena de más reciente a más antigua. */
function log(id: string, mealType: MealType, at: string): MealLog {
  return {
    id,
    user_id: 'user-1',
    meal_type: mealType,
    name: null,
    logged_at: at,
    created_at: at,
    updated_at: at,
    deleted_at: null,
  }
}

function item(logId: string, foodId: string, servings = 1): MealLogItemWithFood {
  return {
    id: `${logId}-${foodId}`,
    meal_log_id: logId,
    food_id: foodId,
    servings,
    created_at: '2026-08-10T12:00:00.000Z',
    updated_at: '2026-08-10T12:00:00.000Z',
    food: food(foodId),
  }
}

describe('buildRepeatableMeals', () => {
  it('sin registros no ofrece nada', () => {
    expect(buildRepeatableMeals([], [], TIPOS)).toEqual({})
  })

  it('junta las comidas que llevan los mismos alimentos', () => {
    // Mismo almuerzo tres días: una sola sugerencia, no tres.
    const logs = [
      log('l3', 'lunch', '2026-08-12T12:00:00.000Z'),
      log('l2', 'lunch', '2026-08-11T12:00:00.000Z'),
      log('l1', 'lunch', '2026-08-10T12:00:00.000Z'),
    ]
    const items = [
      item('l3', 'arroz'),
      item('l3', 'pollo'),
      item('l2', 'arroz'),
      item('l2', 'pollo'),
      item('l1', 'arroz'),
      item('l1', 'pollo'),
    ]

    const result = buildRepeatableMeals(logs, items, TIPOS)

    expect(result.lunch).toHaveLength(1)
    expect(result.lunch?.[0]?.times).toBe(3)
  })

  it('el orden de los alimentos no hace comidas distintas', () => {
    // «arroz y pollo» y «pollo y arroz» es el mismo almuerzo.
    const logs = [
      log('l2', 'lunch', '2026-08-12T12:00:00.000Z'),
      log('l1', 'lunch', '2026-08-11T12:00:00.000Z'),
    ]
    const items = [
      item('l2', 'pollo'),
      item('l2', 'arroz'),
      item('l1', 'arroz'),
      item('l1', 'pollo'),
    ]

    expect(buildRepeatableMeals(logs, items, TIPOS).lunch).toHaveLength(1)
  })

  it('las cantidades distintas no parten la combinación', () => {
    // Es el mismo almuerzo se coma porción y media o dos.
    const logs = [
      log('l2', 'lunch', '2026-08-12T12:00:00.000Z'),
      log('l1', 'lunch', '2026-08-11T12:00:00.000Z'),
    ]
    const items = [item('l2', 'arroz', 2), item('l1', 'arroz', 1.5)]

    const result = buildRepeatableMeals(logs, items, TIPOS)

    expect(result.lunch).toHaveLength(1)
    // Se ofrecen las cantidades de la última vez, que es la mejor apuesta.
    expect(result.lunch?.[0]?.items[0]?.servings).toBe(2)
  })

  it('pone primero lo que más se repite', () => {
    const logs = [
      log('l3', 'lunch', '2026-08-13T12:00:00.000Z'),
      log('l2', 'lunch', '2026-08-12T12:00:00.000Z'),
      log('l1', 'lunch', '2026-08-11T12:00:00.000Z'),
    ]
    // Lo más reciente se comió una vez; lo otro, dos.
    const items = [item('l3', 'pizza'), item('l2', 'arroz'), item('l1', 'arroz')]

    const result = buildRepeatableMeals(logs, items, TIPOS)

    expect(result.lunch?.[0]?.items[0]?.food_id).toBe('arroz')
    expect(result.lunch?.[0]?.times).toBe(2)
    expect(result.lunch?.[1]?.items[0]?.food_id).toBe('pizza')
  })

  it('a igual número de veces gana la más reciente', () => {
    const logs = [
      log('l2', 'lunch', '2026-08-12T12:00:00.000Z'),
      log('l1', 'lunch', '2026-08-11T12:00:00.000Z'),
    ]
    const items = [item('l2', 'pizza'), item('l1', 'arroz')]

    const result = buildRepeatableMeals(logs, items, TIPOS)

    expect(result.lunch?.[0]?.items[0]?.food_id).toBe('pizza')
  })

  it('no mezcla el desayuno con el almuerzo', () => {
    const logs = [
      log('d1', 'breakfast', '2026-08-12T08:00:00.000Z'),
      log('l1', 'lunch', '2026-08-12T12:00:00.000Z'),
    ]
    const items = [item('d1', 'huevo'), item('l1', 'arroz')]

    const result = buildRepeatableMeals(logs, items, TIPOS)

    expect(result.breakfast?.[0]?.items[0]?.food_id).toBe('huevo')
    expect(result.lunch?.[0]?.items[0]?.food_id).toBe('arroz')
  })

  it('salta las comidas que quedaron vacías', () => {
    // Se borró lo que tenían: repetir la nada no sirve.
    const logs = [log('l1', 'lunch', '2026-08-12T12:00:00.000Z')]

    expect(buildRepeatableMeals(logs, [], TIPOS)).toEqual({})
  })

  it('ofrece como mucho tres, para no convertirlo en un menú', () => {
    const logs = Array.from({ length: 6 }, (_unused, index) =>
      log(`l${index}`, 'lunch', `2026-08-0${index + 1}T12:00:00.000Z`),
    )
    const items = logs.map((entry, index) => item(entry.id, `comida-${index}`))

    expect(buildRepeatableMeals(logs, items, TIPOS).lunch).toHaveLength(3)
  })
})
