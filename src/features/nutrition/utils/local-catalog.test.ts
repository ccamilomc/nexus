import { describe, expect, it } from 'vitest'

import { findByBarcode, type LocalFood, searchCatalog, toScannedFood } from './local-catalog'

function producto(overrides: Partial<LocalFood> = {}): LocalFood {
  return {
    codigo: '7702025110285',
    nombre: 'Chocoramo',
    marca: 'Ramo',
    kcal: 380,
    prot: 5,
    carb: 55,
    gras: 15,
    ...overrides,
  }
}

describe('searchCatalog', () => {
  it('con una sola letra no enseña nada', () => {
    // Dos mil productos filtrados por «a» no son una búsqueda: son una lista de
    // la que nadie saca nada.
    expect(searchCatalog([producto()], 'a')).toEqual([])
  })

  it('encuentra por el nombre', () => {
    expect(searchCatalog([producto(), producto({ nombre: 'Gansito' })], 'choco')).toHaveLength(1)
  })

  it('encuentra por la marca', () => {
    // «alpina» tiene que traer sus yogures aunque no lo digan en el nombre.
    const encontrados = searchCatalog(
      [producto({ nombre: 'Yogurt griego', marca: 'Alpina' })],
      'alpina',
    )

    expect(encontrados).toHaveLength(1)
  })

  it('ignora tildes y mayúsculas', () => {
    expect(searchCatalog([producto({ nombre: 'Ponqué' })], 'PONQUE')).toHaveLength(1)
  })

  it('el nombre más corto va primero', () => {
    // Quien escribe «chocoramo» quiere el Chocoramo, no el «Ponqué Chocoramo
    // relleno de arequipe edición especial».
    const encontrados = searchCatalog(
      [
        producto({ codigo: '1', nombre: 'Ponqué Chocoramo relleno de arequipe' }),
        producto({ codigo: '2', nombre: 'Chocoramo' }),
      ],
      'chocoramo',
    )

    expect(encontrados[0]?.nombre).toBe('Chocoramo')
  })

  it('no devuelve más de doce', () => {
    // Más de esto ya no se lee, se hojea.
    const muchos = Array.from({ length: 40 }, (_, i) =>
      producto({ codigo: String(i), nombre: `Arepa ${i}` }),
    )

    expect(searchCatalog(muchos, 'arepa')).toHaveLength(12)
  })

  it('sin coincidencias no inventa nada', () => {
    expect(searchCatalog([producto()], 'sushi')).toEqual([])
  })
})

describe('findByBarcode', () => {
  it('encuentra el producto por su código', () => {
    const encontrado = findByBarcode([producto(), producto({ codigo: '999' })], '999')

    expect(encontrado?.codigo).toBe('999')
  })

  it('un código que no está no devuelve nada', () => {
    expect(findByBarcode([producto()], '0000000000000')).toBeUndefined()
  })
})

describe('toScannedFood', () => {
  it('las cifras van por 100 g, como las publica Open Food Facts', () => {
    // Coincide con el valor por defecto de la tabla: no hay conversión que
    // pueda salir mal.
    expect(toScannedFood(producto())).toEqual({
      name: 'Chocoramo',
      brand: 'Ramo',
      servingSize: 100,
      servingUnit: 'g',
      calories: 380,
      proteinG: 5,
      carbsG: 55,
      fatG: 15,
    })
  })

  it('sin marca, la marca es nula y no una cadena vacía', () => {
    // Una marca vacía es ausencia de marca, no una marca en blanco.
    const { marca: _marca, ...sinMarca } = producto()

    expect(toScannedFood(sinMarca).brand).toBeNull()
  })
})
