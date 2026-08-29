import { matchesQuery } from '@/shared/utils'

import type { ScannedFood } from './scanned-food'

/**
 * Un producto del catálogo colombiano guardado dentro de Nexus.
 *
 * Los nombres son cortos a propósito: son 2.233 fichas y cada letra de más se
 * multiplica por 2.233 en lo que hay que bajarse.
 */
export interface LocalFood {
  readonly codigo: string
  readonly nombre: string
  readonly marca?: string
  readonly kcal: number
  readonly prot: number
  readonly carb: number
  readonly gras: number
  readonly fibra?: number
}

/** Cuántos se enseñan al buscar. Más de esto ya no se lee, se hojea. */
const MAX_RESULTADOS = 12

/**
 * Un producto del catálogo, con la forma que espera el formulario.
 *
 * **Las cifras son por cada 100 g**, que es como las publica Open Food Facts y
 * como ya venían del escáner. Coincide con el valor por defecto de la tabla, así
 * que no hay ninguna conversión que pueda salir mal.
 */
export function toScannedFood(food: LocalFood): ScannedFood {
  return {
    name: food.nombre,
    brand: food.marca ?? null,
    servingSize: 100,
    servingUnit: 'g',
    calories: food.kcal,
    proteinG: food.prot,
    carbsG: food.carb,
    fatG: food.gras,
  }
}

/** El producto con ese código, o nada. */
export function findByBarcode(
  catalog: readonly LocalFood[],
  barcode: string,
): LocalFood | undefined {
  return catalog.find((food) => food.codigo === barcode)
}

/**
 * Los productos que casan con lo escrito, del más corto al más largo.
 *
 * **El nombre más corto primero** porque es el que más se parece a lo que se
 * buscó: quien escribe «chocoramo» quiere el Chocoramo, no el «Ponqué Chocoramo
 * relleno de arequipe edición especial».
 *
 * Se busca también en la marca —«alpina» tiene que traer sus yogures— y sin
 * tildes ni mayúsculas, con el mismo `matchesQuery` que el resto de la
 * aplicación.
 */
export function searchCatalog(catalog: readonly LocalFood[], query: string): readonly LocalFood[] {
  const buscado = query.trim()
  // Sin nada escrito no se enseña un catálogo entero de dos mil productos: eso
  // no es una búsqueda, es una lista de la que nadie saca nada.
  if (buscado.length < 2) return []

  return catalog
    .filter((food) => matchesQuery(`${food.nombre} ${food.marca ?? ''}`, buscado))
    .sort((a, b) => a.nombre.length - b.nombre.length || a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, MAX_RESULTADOS)
}
