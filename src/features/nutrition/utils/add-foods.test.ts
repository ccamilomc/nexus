import { describe, expect, it } from 'vitest'

import type { AddFoodsInput } from '../services/nutrition.service'
import type { DayNutrition, Food, MealEntry, MealType } from '../types/nutrition.types'
import { addFoodsToDay, knownFoods } from './add-foods'

function food(id: string, name: string, calories: number): Food {
  return {
    id,
    user_id: null,
    name,
    brand: null,
    serving_size: 100,
    serving_unit: 'g',
    calories,
    protein_g: 10,
    carbs_g: 20,
    fat_g: 5,
    cost_per_serving: null,
    currency: null,
    is_custom: true,
    fiber_g: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  }
}

const ARROZ = food('arroz', 'Arroz', 130)
const POLLO = food('pollo', 'Pollo', 165)

const SIN_MACROS = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }

function meal(mealType: MealType): MealEntry {
  return { mealType, log: null, items: [], macros: SIN_MACROS }
}

function day(): DayNutrition {
  return {
    meals: [meal('breakfast'), meal('lunch'), meal('dinner'), meal('snack')],
    totals: SIN_MACROS,
  }
}

const input: AddFoodsInput = {
  userId: 'u1',
  dateKey: '2026-08-15',
  mealType: 'lunch',
  items: [
    { id: 'i1', foodId: 'arroz', servings: 1 },
    { id: 'i2', foodId: 'pollo', servings: 2 },
  ],
  loggedAt: '2026-08-15T13:00:00.000Z',
}

describe('addFoodsToDay', () => {
  it('mete los alimentos en su comida y no en otra', () => {
    const actual = addFoodsToDay(day(), input, [ARROZ, POLLO])

    const almuerzo = actual.meals.find(({ mealType }) => mealType === 'lunch')
    expect(almuerzo?.items.map(({ food_id }) => food_id)).toEqual(['arroz', 'pollo'])
    expect(actual.meals.find(({ mealType }) => mealType === 'dinner')?.items).toHaveLength(0)
  })

  it('recalcula los macros de la comida contando las porciones', () => {
    const actual = addFoodsToDay(day(), input, [ARROZ, POLLO])

    // Una porción de arroz (130) más dos de pollo (165 × 2).
    expect(actual.meals.find(({ mealType }) => mealType === 'lunch')?.macros.calories).toBe(460)
  })

  it('el total del día es la suma de las cuatro comidas', () => {
    const actual = addFoodsToDay(day(), input, [ARROZ, POLLO])

    expect(actual.totals.calories).toBe(460)
  })

  it('se añade a lo que ya hubiera en esa comida, sin pisarlo', () => {
    const conAlgo = addFoodsToDay(day(), input, [ARROZ, POLLO])

    const actual = addFoodsToDay(
      conAlgo,
      { ...input, items: [{ id: 'i3', foodId: 'arroz', servings: 1 }] },
      [ARROZ, POLLO],
    )

    expect(actual.meals.find(({ mealType }) => mealType === 'lunch')?.items).toHaveLength(3)
    expect(actual.totals.calories).toBe(590)
  })

  it('deja fuera el alimento que no esté en el catálogo, en vez de pintarlo en blanco', () => {
    // Sin macros descuadraría el total del día, que es lo que se mira.
    const actual = addFoodsToDay(day(), input, [ARROZ])

    expect(actual.meals.find(({ mealType }) => mealType === 'lunch')?.items).toHaveLength(1)
    expect(actual.totals.calories).toBe(130)
  })

  it('sin ningún alimento reconocible devuelve el día tal cual', () => {
    const original = day()

    expect(addFoodsToDay(original, input, [])).toBe(original)
  })

  it('no toca el día original', () => {
    const original = day()

    addFoodsToDay(original, input, [ARROZ, POLLO])

    expect(original.meals.every(({ items }) => items.length === 0)).toBe(true)
  })
})

describe('knownFoods', () => {
  const ref = (f: Food) => ({
    id: f.id,
    name: f.name,
    brand: f.brand,
    serving_size: f.serving_size,
    serving_unit: f.serving_unit,
    calories: f.calories,
    protein_g: f.protein_g,
    carbs_g: f.carbs_g,
    fat_g: f.fat_g,
    cost_per_serving: f.cost_per_serving,
  })

  it('los saca de las combinaciones repetibles, sin catálogo cargado', () => {
    // El fallo que se coló: repitiendo una comida no hay catálogo en la caché
    // —sólo se trae al abrir el buscador—, así que el desayuno seguía diciendo
    // «Sin registros» después de apuntarlo.
    const repetible = {
      breakfast: [
        {
          key: 'k',
          loggedAt: '2026-08-14T08:00:00.000Z',
          times: 4,
          items: [
            {
              id: 'x',
              meal_log_id: 'm',
              food_id: ARROZ.id,
              servings: 1,
              created_at: '2026-08-14T08:00:00.000Z',
              updated_at: '2026-08-14T08:00:00.000Z',
              food: ref(ARROZ),
            },
          ],
        },
      ],
    }

    expect(knownFoods(undefined, repetible, null).map(({ id }) => id)).toEqual([ARROZ.id])
  })

  it('los saca del catálogo cuando se llegó por el buscador', () => {
    expect(knownFoods([ARROZ, POLLO], undefined, null)).toHaveLength(2)
  })

  it('los saca de lo ya comido hoy, para lo que se añade dos veces', () => {
    const conAlmuerzo = addFoodsToDay(day(), input, [ARROZ, POLLO])

    expect(knownFoods(undefined, undefined, conAlmuerzo).map(({ id }) => id)).toEqual([
      ARROZ.id,
      POLLO.id,
    ])
  })

  it('no repite el que aparece en varios sitios', () => {
    const conAlmuerzo = addFoodsToDay(day(), input, [ARROZ, POLLO])

    expect(knownFoods([ARROZ], undefined, conAlmuerzo)).toHaveLength(2)
  })
})
