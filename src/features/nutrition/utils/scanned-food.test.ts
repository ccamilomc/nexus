import { describe, expect, it } from 'vitest'

import { offResponseSchema, toScanResult } from './scanned-food'

/** Una respuesta completa, como la de un producto bien fichado. */
function respuesta(overrides: Record<string, unknown> = {}) {
  return {
    status: 1,
    product: {
      product_name: 'Yogurt griego natural',
      brands: 'Alpina',
      nutriments: {
        'energy-kcal_100g': 97,
        proteins_100g: 8.6,
        carbohydrates_100g: 4.1,
        fat_100g: 5.2,
      },
      ...overrides,
    },
  }
}

describe('toScanResult', () => {
  it('con las cuatro cifras deja el alimento listo', () => {
    const resultado = toScanResult(respuesta())

    expect(resultado).toEqual({
      kind: 'listo',
      food: {
        name: 'Yogurt griego natural',
        brand: 'Alpina',
        servingSize: 100,
        servingUnit: 'g',
        calories: 97,
        proteinG: 8.6,
        carbsG: 4.1,
        fatG: 5.2,
      },
    })
  })

  it('se queda con la primera marca, no con la lista entera', () => {
    // `brands` llega como «Alpina, Alpina S.A., alpina» porque cualquiera puede
    // añadir sinónimos; son la misma empresa escrita de tres formas.
    const resultado = toScanResult(respuesta({ brands: 'Alpina, Alpina S.A., alpina' }))

    expect(resultado).toMatchObject({ food: { brand: 'Alpina' } })
  })

  it('prefiere el nombre en español cuando el producto lo trae', () => {
    const resultado = toScanResult(
      respuesta({ product_name: 'Greek yogurt', product_name_es: 'Yogurt griego' }),
    )

    expect(resultado).toMatchObject({ food: { name: 'Yogurt griego' } })
  })

  it('cae al nombre general si el español viene vacio', () => {
    const resultado = toScanResult(respuesta({ product_name_es: '   ' }))

    expect(resultado).toMatchObject({ food: { name: 'Yogurt griego natural' } })
  })

  it('sin una sola de las cuatro cifras, el producto existe pero faltan macros', () => {
    // Es un tercio de los casos: hay que aprovechar el nombre en vez de tratarlo
    // como si no se hubiera encontrado nada.
    const sinGrasa = respuesta({
      nutriments: { 'energy-kcal_100g': 97, proteins_100g: 8.6, carbohydrates_100g: 4.1 },
    })

    expect(toScanResult(sinGrasa)).toEqual({
      kind: 'sin-macros',
      name: 'Yogurt griego natural',
      brand: 'Alpina',
    })
  })

  it('sin bloque de nutrientes tampoco se descarta el nombre', () => {
    const resultado = toScanResult(respuesta({ nutriments: undefined }))

    expect(resultado).toMatchObject({ kind: 'sin-macros', name: 'Yogurt griego natural' })
  })

  it('un producto sin nombre no sirve de nada, aunque traiga macros', () => {
    // El 12 % de los productos de Colombia estan asi. Rellenar un formulario con
    // las macros y el nombre en blanco es peor que no rellenar nada.
    expect(toScanResult(respuesta({ product_name: '' }))).toEqual({ kind: 'no-esta' })
  })

  it('status 0 es el «no existe» de esta API', () => {
    expect(toScanResult({ status: 0 })).toEqual({ kind: 'no-esta' })
  })

  it('una respuesta sin producto no revienta', () => {
    expect(toScanResult({})).toEqual({ kind: 'no-esta' })
  })

  it('redondea los macros a un decimal y las calorias a entero', () => {
    const resultado = toScanResult(
      respuesta({
        nutriments: {
          'energy-kcal_100g': 96.7,
          proteins_100g: 8.63333,
          carbohydrates_100g: 4.06,
          fat_100g: 5.24999,
        },
      }),
    )

    expect(resultado).toMatchObject({
      food: { calories: 97, proteinG: 8.6, carbsG: 4.1, fatG: 5.2 },
    })
  })

  it('una cifra negativa no es una cifra', () => {
    const resultado = toScanResult(
      respuesta({
        nutriments: {
          'energy-kcal_100g': 97,
          proteins_100g: -1,
          carbohydrates_100g: 4.1,
          fat_100g: 5.2,
        },
      }),
    )

    expect(resultado).toMatchObject({ kind: 'sin-macros' })
  })

  it('un cero sí es una cifra', () => {
    // El agua tiene cero de todo y es un alimento perfectamente valido.
    const resultado = toScanResult(
      respuesta({
        product_name: 'Agua',
        nutriments: {
          'energy-kcal_100g': 0,
          proteins_100g: 0,
          carbohydrates_100g: 0,
          fat_100g: 0,
        },
      }),
    )

    expect(resultado).toMatchObject({ kind: 'listo', food: { calories: 0 } })
  })
})

describe('offResponseSchema', () => {
  it('acepta la respuesta con los cientos de campos que no interesan', () => {
    const parsed = offResponseSchema.safeParse({
      status: 1,
      code: '7702001000012',
      product: { product_name: 'Algo', ecoscore_grade: 'c', otro: { anidado: true } },
    })

    expect(parsed.success).toBe(true)
  })

  it('rechaza un macro que llegue como texto en vez de numero', () => {
    // Sin esto, un «8.6» en cadena entraría hasta el formulario.
    const parsed = offResponseSchema.safeParse({
      status: 1,
      product: { product_name: 'Algo', nutriments: { proteins_100g: '8.6' } },
    })

    expect(parsed.success).toBe(false)
  })
})
