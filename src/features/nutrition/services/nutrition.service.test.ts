import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isAppError } from '@/core/error'

import { nutritionRepository } from '../repositories/nutrition.repository'
import type {
  Food,
  FoodRef,
  MealLog,
  MealLogItem,
  MealLogItemWithFood,
  MealType,
  NutritionGoal,
} from '../types/nutrition.types'
import { nutritionService } from './nutrition.service'

/**
 * El repositorio se sustituye por completo: estos tests comprueban **reglas de
 * negocio**, no consultas. Con la factoría, el módulo real ni siquiera se carga,
 * así que no arrastra el cliente de Supabase (ni sus variables de entorno).
 */
vi.mock('../repositories/nutrition.repository', () => ({
  nutritionRepository: {
    listFoods: vi.fn(),
    insertFood: vi.fn(),
    updateFood: vi.fn(),
    deleteFood: vi.fn(),
    listMealLogsBetween: vi.fn(),
    listRecentMealLogs: vi.fn(),
    listItemsByMealLogs: vi.fn(),
    insertMealLog: vi.fn(),
    insertMealLogItem: vi.fn(),
    insertMealLogItems: vi.fn(),
    deleteMealLogItem: vi.fn(),
    findActiveGoal: vi.fn(),
    deactivateGoals: vi.fn(),
    insertGoal: vi.fn(),
    listWaterLogsBetween: vi.fn(),
    insertWaterLog: vi.fn(),
    softDeleteWaterLog: vi.fn(),
    softDeleteMealLog: vi.fn(),
  },
}))

const listMealLogsBetween = vi.mocked(nutritionRepository.listMealLogsBetween)
const listRecentMealLogs = vi.mocked(nutritionRepository.listRecentMealLogs)
const listItemsByMealLogs = vi.mocked(nutritionRepository.listItemsByMealLogs)
const insertMealLog = vi.mocked(nutritionRepository.insertMealLog)
const insertMealLogItem = vi.mocked(nutritionRepository.insertMealLogItem)
const insertMealLogItems = vi.mocked(nutritionRepository.insertMealLogItems)
const insertWaterLog = vi.mocked(nutritionRepository.insertWaterLog)
const insertFood = vi.mocked(nutritionRepository.insertFood)
const deleteFood = vi.mocked(nutritionRepository.deleteFood)
const listFoods = vi.mocked(nutritionRepository.listFoods)
const updateFood = vi.mocked(nutritionRepository.updateFood)
const deactivateGoals = vi.mocked(nutritionRepository.deactivateGoals)
const insertGoal = vi.mocked(nutritionRepository.insertGoal)

const USER_ID = 'user-1'
/** Miércoles 29 de julio de 2026, a media tarde. */
const DATE = new Date(2026, 6, 29, 16, 30)

const CHICKEN: FoodRef = {
  id: 'food-chicken',
  name: 'Pollo',
  brand: null,
  serving_size: 100,
  serving_unit: 'g',
  calories: 165,
  protein_g: 31,
  carbs_g: 0,
  fat_g: 3.6,
  cost_per_serving: 4000,
}

/** Un segundo alimento, para comprobar que dos comidas distintas no se juntan. */
const OTHER_FOOD: FoodRef = { ...CHICKEN, id: 'food-arroz', name: 'Arroz' }

/** Fila devuelta por la base tras guardar; los tests sólo miran lo que envían. */
const SAVED_FOOD: Food = {
  ...CHICKEN,
  currency: 'COP',
  fiber_g: null,
  is_custom: true,
  user_id: USER_ID,
  created_at: '2026-07-29T17:00:00.000Z',
  updated_at: '2026-07-29T17:00:00.000Z',
}

const SAVED_GOAL: NutritionGoal = {
  id: 'goal-1',
  user_id: USER_ID,
  calories_target: 2200,
  protein_g_target: 150,
  carbs_g_target: 220,
  fat_g_target: 70,
  water_ml_target: 2500,
  is_active: true,
  effective_from: '2026-07-29',
  created_at: '2026-07-29T17:00:00.000Z',
  updated_at: '2026-07-29T17:00:00.000Z',
  deleted_at: null,
}

function mealLog(id: string, mealType: MealType): MealLog {
  return {
    id,
    user_id: USER_ID,
    meal_type: mealType,
    name: null,
    logged_at: '2026-07-29T17:00:00.000Z',
    created_at: '2026-07-29T17:00:00.000Z',
    updated_at: '2026-07-29T17:00:00.000Z',
    deleted_at: null,
  }
}

function item(
  id: string,
  mealLogId: string,
  servings: number,
  food = CHICKEN,
): MealLogItemWithFood {
  return {
    id,
    meal_log_id: mealLogId,
    food_id: food.id,
    servings,
    created_at: '2026-07-29T17:00:00.000Z',
    updated_at: '2026-07-29T17:00:00.000Z',
    food,
  }
}

/** Ítem guardado; el service no lo usa, pero el repositorio siempre lo devuelve. */
const SAVED_ITEM: MealLogItem = {
  id: 'item-1',
  meal_log_id: 'nuevo',
  food_id: CHICKEN.id,
  servings: 1,
  created_at: '2026-07-29T17:00:00.000Z',
  updated_at: '2026-07-29T17:00:00.000Z',
}

const ADD_LUNCH = {
  userId: USER_ID,
  date: DATE,
  mealType: 'lunch',
  items: [{ foodId: CHICKEN.id, servings: 1.5 }],
  now: DATE,
} as const

const GOAL_VALUES = {
  caloriesTarget: 2200,
  proteinGTarget: 150,
  carbsGTarget: 220,
  fatGTarget: 70,
  waterMlTarget: 2500,
}

beforeEach(() => {
  vi.clearAllMocks()
  listMealLogsBetween.mockResolvedValue([])
  listRecentMealLogs.mockResolvedValue([])
  listItemsByMealLogs.mockResolvedValue([])
  insertMealLog.mockImplementation(async (_userId, mealType) => mealLog('nuevo', mealType))
  insertMealLogItem.mockResolvedValue(SAVED_ITEM)
  insertMealLogItems.mockResolvedValue([SAVED_ITEM])
})

describe('nutritionService.addFoodsToMeal', () => {
  it('crea la comida la primera vez y registra el alimento en ella', async () => {
    listMealLogsBetween.mockResolvedValue([])

    await nutritionService.addFoodsToMeal(ADD_LUNCH)

    expect(insertMealLog).toHaveBeenCalledTimes(1)
    expect(insertMealLog.mock.calls[0]?.slice(0, 2)).toEqual([USER_ID, 'lunch'])
    expect(insertMealLogItems).toHaveBeenCalledExactlyOnceWith([
      { meal_log_id: 'nuevo', food_id: CHICKEN.id, servings: 1.5 },
    ])
  })

  it('guarda toda la comida en una escritura, no una por plato', async () => {
    // De una en una podían quedarse a medias: dos platos guardados y dos no.
    listMealLogsBetween.mockResolvedValue([])

    await nutritionService.addFoodsToMeal({
      ...ADD_LUNCH,
      items: [
        { foodId: 'arroz', servings: 1 },
        { foodId: 'pollo', servings: 1.5 },
        { foodId: 'ensalada', servings: 2 },
      ],
    })

    expect(insertMealLogItems).toHaveBeenCalledOnce()
    expect(insertMealLogItems.mock.calls[0]?.[0]).toHaveLength(3)
    expect(insertMealLog).toHaveBeenCalledTimes(1)
  })

  it('todos los platos van a la misma comida', async () => {
    listMealLogsBetween.mockResolvedValue([mealLog('almuerzo-de-hoy', 'lunch')])

    await nutritionService.addFoodsToMeal({
      ...ADD_LUNCH,
      items: [
        { foodId: 'arroz', servings: 1 },
        { foodId: 'pollo', servings: 1 },
      ],
    })

    const rows = insertMealLogItems.mock.calls[0]?.[0] ?? []
    expect(rows.every((row) => row.meal_log_id === 'almuerzo-de-hoy')).toBe(true)
  })

  it('sin nada elegido no crea una comida vacía', async () => {
    // Un almuerzo sin platos ni siquiera cuenta como día registrado.
    await nutritionService.addFoodsToMeal({ ...ADD_LUNCH, items: [] })

    expect(insertMealLog).not.toHaveBeenCalled()
    expect(insertMealLogItems).not.toHaveBeenCalled()
  })

  it('reutiliza la comida del día en lugar de partirla en varias', async () => {
    listMealLogsBetween.mockResolvedValue([mealLog('almuerzo-de-hoy', 'lunch')])

    await nutritionService.addFoodsToMeal(ADD_LUNCH)

    expect(insertMealLog).not.toHaveBeenCalled()
    expect(insertMealLogItems).toHaveBeenCalledWith([
      expect.objectContaining({ meal_log_id: 'almuerzo-de-hoy' }),
    ])
  })

  it('no mete el almuerzo dentro del desayuno ya registrado', async () => {
    listMealLogsBetween.mockResolvedValue([mealLog('desayuno-de-hoy', 'breakfast')])

    await nutritionService.addFoodsToMeal(ADD_LUNCH)

    expect(insertMealLog).toHaveBeenCalledTimes(1)
    expect(insertMealLogItems).toHaveBeenCalledWith([
      expect.objectContaining({ meal_log_id: 'nuevo' }),
    ])
  })

  it('busca la comida dentro del día local, no del día UTC', async () => {
    // A las 16:30 en Bogotá ya es de noche en UTC: si el rango se calculara en
    // UTC, la cena caería en el día siguiente.
    await nutritionService.addFoodsToMeal(ADD_LUNCH)

    const [userId, fromIso, toIso] = listMealLogsBetween.mock.calls[0] ?? []
    expect(userId).toBe(USER_ID)
    expect(fromIso).toBe(new Date(2026, 6, 29).toISOString())
    expect(toIso).toBe(new Date(2026, 6, 30).toISOString())
  })

  it('fecha la comida nueva en el día que se apunta, no en el de hoy', async () => {
    // Apuntar la cena de anteayer creaba la comida con la hora actual, así que
    // el alimento acababa en el día equivocado. No se veía mientras la pantalla
    // estaba clavada en hoy.
    listMealLogsBetween.mockResolvedValue([])
    const ANTEAYER = new Date(2026, 6, 27)

    await nutritionService.addFoodsToMeal({ ...ADD_LUNCH, date: ANTEAYER, now: DATE })

    const loggedAt = new Date(insertMealLog.mock.calls[0]?.[2] ?? '')
    expect(loggedAt.getDate()).toBe(27)
    expect(loggedAt.getHours()).toBe(12)
  })

  it('si el día es hoy conserva la hora real', async () => {
    listMealLogsBetween.mockResolvedValue([])

    await nutritionService.addFoodsToMeal(ADD_LUNCH)

    expect(insertMealLog.mock.calls[0]?.[2]).toBe(DATE.toISOString())
  })

  it('traduce un fallo del repositorio a un error con mensaje humano', async () => {
    insertMealLogItems.mockRejectedValue(new Error('null value in column "servings"'))

    const error: unknown = await nutritionService.addFoodsToMeal(ADD_LUNCH).catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).not.toContain('column')
  })
})

describe('nutritionService.getRepeatableMeals', () => {
  it('sin comidas anteriores no hay nada que repetir', async () => {
    const byType = await nutritionService.getRepeatableMeals(USER_ID, DATE)

    expect(Object.keys(byType)).toHaveLength(0)
  })

  it('busca sólo en las dos últimas semanas y antes de hoy', async () => {
    await nutritionService.getRepeatableMeals(USER_ID, DATE)

    const [userId, sinceIso, beforeIso] = listRecentMealLogs.mock.calls[0] ?? []
    expect(userId).toBe(USER_ID)
    // Hoy es el 29; la ventana empieza el 15 y acaba al empezar hoy.
    expect(beforeIso).toBe(new Date(2026, 6, 29).toISOString())
    expect(sinceIso).toBe(new Date(2026, 6, 15).toISOString())
  })

  it('resuelve las cuatro comidas con una sola consulta', async () => {
    listRecentMealLogs.mockResolvedValue([mealLog('l1', 'lunch'), mealLog('d1', 'dinner')])
    listItemsByMealLogs.mockResolvedValue([item('i1', 'l1', 2), item('i2', 'd1', 1)])

    const byType = await nutritionService.getRepeatableMeals(USER_ID, DATE)

    expect(listRecentMealLogs).toHaveBeenCalledTimes(1)
    expect(byType.lunch?.[0]?.items).toHaveLength(1)
    expect(byType.dinner?.[0]?.items).toHaveLength(1)
    expect(byType.breakfast).toBeUndefined()
  })

  it('ofrece varias combinaciones de la misma comida, no sólo la última', async () => {
    // Uno no come siempre lo mismo: está el almuerzo de diario y el otro.
    listRecentMealLogs.mockResolvedValue([mealLog('ayer', 'lunch'), mealLog('anteayer', 'lunch')])
    listItemsByMealLogs.mockResolvedValue([
      item('i1', 'ayer', 2),
      item('i2', 'anteayer', 1, OTHER_FOOD),
    ])

    const byType = await nutritionService.getRepeatableMeals(USER_ID, DATE)

    expect(byType.lunch).toHaveLength(2)
  })

  it('salta las comidas que quedaron vacías', async () => {
    // Se registró y luego se borró lo que tenía: repetir la nada no sirve.
    listRecentMealLogs.mockResolvedValue([
      mealLog('vacia', 'lunch'),
      mealLog('con-comida', 'lunch'),
    ])
    listItemsByMealLogs.mockResolvedValue([item('i1', 'con-comida', 1)])

    const byType = await nutritionService.getRepeatableMeals(USER_ID, DATE)

    expect(byType.lunch).toHaveLength(1)
    expect(byType.lunch?.[0]?.items[0]?.meal_log_id).toBe('con-comida')
  })

  it('si todas están vacías, no ofrece nada', async () => {
    listRecentMealLogs.mockResolvedValue([mealLog('vacia', 'lunch')])
    listItemsByMealLogs.mockResolvedValue([])

    expect(Object.keys(await nutritionService.getRepeatableMeals(USER_ID, DATE))).toHaveLength(0)
  })

  it('sobrevive a ida y vuelta por JSON', async () => {
    // Esto **reventaba la pantalla de Nutrición**. Devolvía un `Map`, y la caché
    // de TanStack se persiste en `localStorage` con `JSON.stringify` (ADR-0007):
    // un `Map` se serializa como `{}` y vuelve como un objeto pelado, así que al
    // rehidratar `.get` ya no existía. Sólo se veía con la caché caliente.
    //
    // La regla que fija este test: **todo lo que devuelva una consulta tiene que
    // sobrevivir a JSON**. Nada de `Map`, `Set`, `Date` ni instancias de clase.
    listRecentMealLogs.mockResolvedValue([mealLog('ayer', 'lunch')])
    listItemsByMealLogs.mockResolvedValue([item('i1', 'ayer', 2)])

    const byType = await nutritionService.getRepeatableMeals(USER_ID, DATE)
    const rehidratado: unknown = JSON.parse(JSON.stringify(byType))

    expect(rehidratado).toEqual(byType)
  })
})

describe('nutritionService.addWater', () => {
  // El día correcto se decide al armar el registro, y se prueba en
  // `utils/water-input.test.ts`: aquí ya llega resuelto porque esto puede
  // enviarse horas después, sin red de por medio (ADR-0011).
  it('guarda el registro con el id que trae, para que reenviarlo no duplique', async () => {
    await nutritionService.addWater({
      id: 'w1',
      userId: USER_ID,
      amountMl: 250,
      loggedAt: DATE.toISOString(),
    })

    expect(insertWaterLog).toHaveBeenCalledWith('w1', USER_ID, 250, DATE.toISOString())
  })
})

describe('nutritionService.getDayNutrition', () => {
  it('devuelve las cuatro comidas con sus macros y el total del día', async () => {
    listMealLogsBetween.mockResolvedValue([mealLog('l1', 'lunch')])
    listItemsByMealLogs.mockResolvedValue([item('i1', 'l1', 2)])

    const day = await nutritionService.getDayNutrition(USER_ID, DATE)

    expect(day.meals).toHaveLength(4)
    expect(listItemsByMealLogs).toHaveBeenCalledExactlyOnceWith(['l1'])
    // 2 porciones de pollo: los macros se calculan, nunca se almacenan.
    expect(day.totals.calories).toBe(330)
    expect(day.totals.proteinG).toBe(62)
  })

  it('un día sin comidas no pide ítems y sigue devolviendo las cuatro comidas', async () => {
    const day = await nutritionService.getDayNutrition(USER_ID, DATE)

    expect(listItemsByMealLogs).toHaveBeenCalledExactlyOnceWith([])
    expect(day.meals.every((meal) => meal.log === null)).toBe(true)
    expect(day.totals.calories).toBe(0)
  })
})

describe('nutritionService.saveGoal', () => {
  it('jubila el objetivo vigente antes de crear el nuevo', async () => {
    const order: string[] = []
    deactivateGoals.mockImplementation(async () => void order.push('deactivate'))
    insertGoal.mockImplementation(async () => {
      order.push('insert')
      return SAVED_GOAL
    })

    await nutritionService.saveGoal(USER_ID, GOAL_VALUES)

    // El orden importa: al revés quedarían dos objetivos vigentes a la vez.
    expect(order).toEqual(['deactivate', 'insert'])
  })

  it('no guarda ninguna cifra de dinero: eso es de finanzas', async () => {
    // Aquí vivía un presupuesto semanal de comida, medido sobre el coste de lo
    // comido. Competía con el tope de categoría de finanzas, que mide lo que de
    // verdad salió, y ninguna regla del motor lo usaba.
    insertGoal.mockResolvedValue(SAVED_GOAL)

    await nutritionService.saveGoal(USER_ID, GOAL_VALUES)

    const [row] = insertGoal.mock.calls[0] ?? []
    expect(row).not.toHaveProperty('weekly_food_budget')
    expect(row).toEqual(
      expect.objectContaining({ user_id: USER_ID, calories_target: GOAL_VALUES.caloriesTarget }),
    )
  })
})

describe('nutritionService.repriceFoods', () => {
  /** El pollo del usuario: porción de 100 g, a $4.000 desde la última compra. */
  const OWN_CHICKEN: Food = { ...SAVED_FOOD }

  /** Del catálogo de Nexus: sin precio y de nadie. */
  const GLOBAL_RICE: Food = {
    ...SAVED_FOOD,
    id: 'food-rice',
    name: 'Arroz blanco cocido',
    cost_per_serving: null,
    currency: null,
    is_custom: false,
    user_id: null,
  }

  beforeEach(() => {
    listFoods.mockResolvedValue([OWN_CHICKEN, GLOBAL_RICE])
    updateFood.mockResolvedValue(SAVED_FOOD)
  })

  it('reparte lo pagado entre las porciones y guarda el precio nuevo', async () => {
    // Un kilo por $18.000, con la porción en 100 g: $1.800 por porción.
    await nutritionService.repriceFoods([
      { foodId: OWN_CHICKEN.id, quantity: 1000, paidCop: 18_000 },
    ])

    expect(updateFood).toHaveBeenCalledWith(OWN_CHICKEN.id, {
      cost_per_serving: 1800,
      currency: 'COP',
    })
  })

  it('devuelve el precio anterior para poder decir cuánto cambió', async () => {
    const [change] = await nutritionService.repriceFoods([
      { foodId: OWN_CHICKEN.id, quantity: 1000, paidCop: 18_000 },
    ])

    expect(change).toEqual({
      foodId: OWN_CHICKEN.id,
      name: OWN_CHICKEN.name,
      previousCop: 4000,
      nextCop: 1800,
    })
  })

  it('no toca el catálogo de Nexus: un precio es de quien lo paga', async () => {
    // La RLS lo rechazaría de todas formas; aquí se evita el error técnico.
    const changes = await nutritionService.repriceFoods([
      { foodId: GLOBAL_RICE.id, quantity: 1000, paidCop: 5_000 },
    ])

    expect(updateFood).not.toHaveBeenCalled()
    expect(changes).toEqual([])
  })

  it('se salta lo que no da un precio con sentido en vez de escribir basura', async () => {
    const changes = await nutritionService.repriceFoods([
      { foodId: OWN_CHICKEN.id, quantity: 0, paidCop: 18_000 },
    ])

    expect(updateFood).not.toHaveBeenCalled()
    expect(changes).toEqual([])
  })

  it('un alimento que ya no existe no revienta la compra entera', async () => {
    const changes = await nutritionService.repriceFoods([
      { foodId: 'food-borrado', quantity: 500, paidCop: 9_000 },
      { foodId: OWN_CHICKEN.id, quantity: 1000, paidCop: 18_000 },
    ])

    expect(changes.map(({ foodId }) => foodId)).toEqual([OWN_CHICKEN.id])
  })

  it('un fallo al escribir llega como error de dominio, sin detalles técnicos', async () => {
    updateFood.mockRejectedValue(new Error('connection terminated unexpectedly'))

    const error: unknown = await nutritionService
      .repriceFoods([{ foodId: OWN_CHICKEN.id, quantity: 1000, paidCop: 18_000 }])
      .catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).not.toContain('connection')
  })
})

describe('nutritionService.createFood', () => {
  it('marca la moneda sólo cuando hay precio', async () => {
    insertFood.mockResolvedValue(SAVED_FOOD)

    await nutritionService.createFood(USER_ID, {
      name: 'Hamburguesa',
      servingSize: 1,
      servingUnit: 'unidad',
      calories: 550,
      proteinG: 25,
      carbsG: 40,
      fatG: 30,
      costPerServing: 18000,
    })

    expect(insertFood).toHaveBeenCalledWith(
      expect.objectContaining({ cost_per_serving: 18000, currency: 'COP' }),
    )
  })

  it('sin precio no inventa moneda ni marca vacía', async () => {
    insertFood.mockResolvedValue(SAVED_FOOD)

    await nutritionService.createFood(USER_ID, {
      name: 'Manzana',
      servingSize: 1,
      servingUnit: 'unidad',
      calories: 95,
      proteinG: 0.5,
      carbsG: 25,
      fatG: 0.3,
    })

    expect(insertFood).toHaveBeenCalledWith(
      expect.objectContaining({ cost_per_serving: null, currency: null, brand: null }),
    )
  })
})

describe('nutritionService.deleteFood', () => {
  it('explica en cristiano que el alimento ya está registrado en una comida', async () => {
    // 23503: la base lo impide con `on delete restrict`.
    deleteFood.mockRejectedValue({ code: '23503', message: 'violates foreign key constraint' })

    const error: unknown = await nutritionService.deleteFood('f1').catch((e) => e)

    expect(error).toEqual({
      code: 'conflict',
      message:
        'No puedes borrar un alimento que ya registraste en una comida. Quítalo de ahí primero.',
    })
  })

  it('cualquier otro fallo llega como error genérico, sin detalles técnicos', async () => {
    deleteFood.mockRejectedValue(new Error('connection terminated unexpectedly'))

    const error: unknown = await nutritionService.deleteFood('f1').catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).not.toContain('connection')
  })
})
