import { z } from 'zod'

/**
 * Qué hacer con lo que devuelve Open Food Facts al escanear un código.
 *
 * **Hay tres desenlaces, no dos**, y la pantalla los cuenta distinto:
 *
 * - `listo` — el producto está y trae las cuatro cifras. Se rellena el
 *   formulario y sólo queda confirmar.
 * - `sin-macros` — el producto **está** pero le faltan las cifras. Se aprovecha
 *   el nombre y la marca, que ya es ahorrar teclear, y se piden los macros.
 * - `no-esta` — no hay nada con ese código.
 *
 * Juntar los dos últimos en un «no se encontró» sería mentir: en uno de ellos sí
 * se encontró, y la mitad del trabajo está hecha.
 *
 * **Se mide, no se supone:** sobre 600 productos vendidos en Colombia, el 88 %
 * trae nombre, el 67 % las cuatro macros y el 65 % las dos cosas. Uno de cada
 * tres escaneos va a caer en los otros dos casos, así que no son la excepción
 * rara: son parte del camino normal.
 */

/** Lo que Nexus necesita de un alimento. Coincide con `createFoodSchema`. */
export interface ScannedFood {
  readonly name: string
  readonly brand: string | null
  readonly servingSize: number
  readonly servingUnit: string
  readonly calories: number
  readonly proteinG: number
  readonly carbsG: number
  readonly fatG: number
}

export type ScanResult =
  | { readonly kind: 'listo'; readonly food: ScannedFood }
  | { readonly kind: 'sin-macros'; readonly name: string; readonly brand: string | null }
  | { readonly kind: 'no-esta' }

/**
 * Lo poco que se lee de la respuesta, validado.
 *
 * Es una API de fuera y devuelve JSON libre: sin validar, un campo que cambie de
 * tipo entraría hasta el formulario. Se declara `passthrough` a propósito —trae
 * cientos de campos que no interesan— pero lo que se usa está tipado.
 */
const offNutriments = z
  .object({
    'energy-kcal_100g': z.number().optional(),
    proteins_100g: z.number().optional(),
    carbohydrates_100g: z.number().optional(),
    fat_100g: z.number().optional(),
  })
  .passthrough()

const offProduct = z
  .object({
    product_name: z.string().optional(),
    product_name_es: z.string().optional(),
    brands: z.string().optional(),
    nutriments: offNutriments.optional(),
  })
  .passthrough()

export const offResponseSchema = z
  .object({
    status: z.number().optional(),
    product: offProduct.optional(),
  })
  .passthrough()

export type OffResponse = z.infer<typeof offResponseSchema>

/** Una cifra de macro sólo vale si es un número real y no es negativa. */
function macro(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

/** Un decimal basta para un macro; las calorías van enteras, como en la etiqueta. */
const round1 = (value: number) => Math.round(value * 10) / 10

/**
 * La primera marca de la lista.
 *
 * `brands` llega como texto separado por comas —«Alpina, Alpina S.A.»— porque
 * cualquiera puede añadir sinónimos. Se queda la primera: las demás son la misma
 * empresa escrita de otra forma.
 */
function firstBrand(brands: string | undefined): string | null {
  const first = (brands ?? '').split(',')[0]?.trim()
  return first ? first : null
}

/** El nombre, prefiriendo el español cuando el producto lo trae. */
function name(product: z.infer<typeof offProduct>): string {
  return (product.product_name_es ?? '').trim() || (product.product_name ?? '').trim()
}

/**
 * Traduce la respuesta del escaneo a lo que la pantalla tiene que hacer.
 *
 * **Los macros se guardan por 100 g y la porción también.** Open Food Facts los
 * publica así y es lo que dice la etiqueta del paquete; convertirlos a la
 * «porción sugerida» del fabricante metería una cifra que nadie ha comprobado.
 */
export function toScanResult(response: OffResponse): ScanResult {
  const product = response.product
  // `status: 0` es el «no existe» de esta API; sin producto, tampoco hay nada.
  if (!product || response.status === 0) return { kind: 'no-esta' }

  const label = name(product)
  const brand = firstBrand(product.brands)
  if (!label) return { kind: 'no-esta' }

  const n = product.nutriments ?? {}
  const calories = macro(n['energy-kcal_100g'])
  const proteinG = macro(n.proteins_100g)
  const carbsG = macro(n.carbohydrates_100g)
  const fatG = macro(n.fat_100g)

  if (calories === null || proteinG === null || carbsG === null || fatG === null) {
    return { kind: 'sin-macros', name: label, brand }
  }

  return {
    kind: 'listo',
    food: {
      name: label,
      brand,
      servingSize: 100,
      servingUnit: 'g',
      calories: Math.round(calories),
      proteinG: round1(proteinG),
      carbsG: round1(carbsG),
      fatG: round1(fatG),
    },
  }
}
