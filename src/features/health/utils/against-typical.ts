import type { Baseline } from '@/shared/utils'

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
 * Cuántas veces el vaivén hay que apartarse para que una lectura sea rara.
 *
 * **Dos, y está medido.** Sobre 62 pesadas reales, dos vaivenes dejan fuera seis
 * —una de cada diez—, que es la frecuencia de algo que merece mirarse. Con uno
 * saldrían casi la mitad y dejaría de significar nada.
 */
const UNUSUAL_SPREADS = 2

/** Dos decimales, los mismos que guarda la columna. */
const round = (value: number) => Math.round(value * 100) / 100

/**
 * Si la lectura de hoy es rara para ti, o es martes.
 *
 * **Es la pregunta que una resta no contesta.** Ver 93,5 después de 91,8 asusta,
 * pero si tu peso se mueve ±0,8 kg de una pesada a otra —por el agua, la comida
 * y la hora a la que uno se sube a la báscula— eso no es haber engordado kilo y
 * medio: es la misma persona un día distinto.
 *
 * **No opina.** Dice dónde cae el número y cuánto sueles moverte; si eso es
 * bueno o malo depende de qué persigue quien se pesa, y eso Nexus no lo sabe
 * (docs/11).
 *
 * Devuelve `null` sin costumbre con la que comparar: rellenarlo con la resta de
 * dos lecturas sería justo el ruido del que se huye.
 */
export function readingAgainstTypical(
  value: number,
  typical: Baseline | null,
): AgainstTypical | null {
  if (typical === null) return null

  const difference = value - typical.typical

  return {
    typical: round(typical.typical),
    difference: round(difference),
    spread: round(typical.spread),
    // Un vaivén de cero —siempre la misma cifra— haría rara cualquier
    // diferencia, incluida la de cien gramos. Ahí no se dice nada.
    isUnusual: typical.spread > 0 && Math.abs(difference) > typical.spread * UNUSUAL_SPREADS,
  }
}
