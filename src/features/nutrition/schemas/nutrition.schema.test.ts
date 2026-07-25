import { describe, expect, it } from 'vitest'

import { addFoodSchema, createFoodSchema } from './nutrition.schema'

describe('addFoodSchema', () => {
  it('acepta porciones enteras y fraccionadas', () => {
    expect(addFoodSchema.safeParse({ servings: 1 }).success).toBe(true)
    expect(addFoodSchema.safeParse({ servings: 1.5 }).success).toBe(true)
  })

  it('rechaza cero o negativo: registrar «nada» no es un registro', () => {
    expect(addFoodSchema.safeParse({ servings: 0 }).success).toBe(false)
    expect(addFoodSchema.safeParse({ servings: -1 }).success).toBe(false)
  })
})

describe('createFoodSchema', () => {
  const hamburguesa = {
    name: 'Hamburguesa sencilla',
    servingSize: 1,
    servingUnit: 'unidad',
    calories: 550,
    proteinG: 25,
    carbsG: 40,
    fatG: 30,
  }

  it('acepta un alimento sin marca ni precio', () => {
    expect(createFoodSchema.safeParse(hamburguesa).success).toBe(true)
  })

  it('acepta un precio en pesos colombianos', () => {
    const result = createFoodSchema.safeParse({ ...hamburguesa, costPerServing: 18000 })

    expect(result.success).toBe(true)
    expect(result.data?.costPerServing).toBe(18000)
  })

  it('recorta el nombre y rechaza el vacío', () => {
    expect(createFoodSchema.safeParse({ ...hamburguesa, name: '  Gaseosa  ' }).data?.name).toBe(
      'Gaseosa',
    )
    expect(createFoodSchema.safeParse({ ...hamburguesa, name: '   ' }).success).toBe(false)
  })

  it('rechaza macros negativos y porciones de cero', () => {
    expect(createFoodSchema.safeParse({ ...hamburguesa, proteinG: -1 }).success).toBe(false)
    expect(createFoodSchema.safeParse({ ...hamburguesa, servingSize: 0 }).success).toBe(false)
  })

  it('admite cero calorías: hay bebidas que no aportan', () => {
    expect(createFoodSchema.safeParse({ ...hamburguesa, calories: 0 }).success).toBe(true)
  })
})
