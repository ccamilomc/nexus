import type { Baseline } from './baseline'

/** Dónde cae una lectura respecto a lo normal en ti. */
export interface AgainstTypical {
  /** Lo normal, ya redondeado a los decimales de la medida. */
  readonly typical: number
  /** Cuánto se aparta la lectura. Negativo por debajo. */
  readonly difference: number
  /** Cuánto se mueve normalmente esa medida, arriba o abajo. */
  readonly spread: number
  /** Si la lectura se sale de ese vaivén y merece mirarse dos veces. */
  readonly isUnusual: boolean
}

/**
 * Dos decimales.
 *
 * Es la precisión de la medida más fina que la usa —los kilos—, y no le sobra a
 * ninguna: los pesos colombianos son enteros y redondear a dos no los toca.
 */
const round = (value: number) => Math.round(value * 100) / 100

/**
 * Si la lectura de hoy es rara para ti, o es martes.
 *
 * **Es la pregunta que una resta no contesta.** Ver 93,5 después de 91,8 asusta,
 * pero si tu peso se mueve ±0,8 kg de una pesada a otra —por el agua, la comida
 * y la hora a la que uno se sube a la báscula— eso no es haber engordado kilo y
 * medio: es la misma persona un día distinto. Un mercado de 180.000 al lado de
 * uno de 155.000 es la misma compra con dos cosas más.
 *
 * **No opina.** Dice dónde cae el número y cuánto sueles moverte; si eso es
 * bueno o malo depende de qué persigue quien mide, y eso Nexus no lo sabe
 * (docs/11).
 *
 * **Cuántos vaivenes hacen algo raro lo decide cada dominio**, porque no se
 * reparten igual: el peso oscila arriba y abajo de una cifra, y el gasto tiene
 * muchos pequeños y unos pocos grandes. Con el mismo umbral, una de las dos
 * hablaría demasiado.
 *
 * Devuelve `null` sin costumbre con la que comparar: rellenarlo con la resta de
 * dos lecturas sería justo el ruido del que se huye.
 */
export function readingAgainstTypical(
  value: number,
  typical: Baseline | null,
  spreads: number,
): AgainstTypical | null {
  if (typical === null) return null

  const difference = value - typical.typical

  return {
    typical: round(typical.typical),
    difference: round(difference),
    spread: round(typical.spread),
    // Un vaivén de cero —siempre la misma cifra— haría rara cualquier
    // diferencia, incluida la de cien gramos. Ahí no se dice nada.
    isUnusual: typical.spread > 0 && Math.abs(difference) > typical.spread * spreads,
  }
}
