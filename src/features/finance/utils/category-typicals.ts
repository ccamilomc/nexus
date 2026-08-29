import {
  type AgainstTypical,
  type Baseline,
  baselineOf,
  readingAgainstTypical,
  toDateKey,
} from '@/shared/utils'

import type { FinanceTransactionWithNames } from '../types/finance.types'
import { transactionParts } from './finance-totals'

/**
 * Lo normal de una categoría.
 *
 * **Va en una lista y no en un `Map` a propósito.** Esto se guarda en el
 * teléfono con el resto de la caché, y un `Map` se convierte en `{}` al pasar
 * por JSON: volvería vacío y sin avisar. Ver `CACHE_BUSTER`.
 */
export interface CategoryTypical extends Baseline {
  readonly categoryId: string
}

/**
 * Gastos que hacen falta en una categoría para hablar de costumbre.
 *
 * **Ocho, y está medido.** Sobre 153 gastos reales, con ocho hablan seis
 * categorías y cubren 133 de ellos —el 87 %—. Bajando a cuatro entran
 * categorías donde uno de cada cuatro gastos saldría raro, que es ruido: con
 * cinco muestras el vaivén todavía no es el de la categoría, es el del azar.
 */
const MIN_EXPENSES = 8

/**
 * Cuánto sueles gastar en cada categoría, y cuánto se mueve.
 *
 * **Por partes y no por movimiento**, igual que el reparto del mes: una compra
 * repartida entre Mercado y Hogar es un gasto de mercado y otro de hogar, y
 * contarla entera en una de las dos ensuciaría las dos costumbres.
 *
 * **Lo que no tiene categoría se queda fuera.** «Sin categoría» no es una
 * categoría: ahí caen un arriendo y un café, y una costumbre sacada de esa
 * mezcla no significa nada.
 *
 * Las categorías con pocos gastos no salen en la lista, que es como se dice que
 * de ellas todavía no se sabe.
 */
export function categoryTypicals(
  transactions: readonly FinanceTransactionWithNames[],
): readonly CategoryTypical[] {
  const amounts = new Map<string, number[]>()

  for (const transaction of transactions) {
    if (transaction.kind !== 'expense') continue

    for (const part of transactionParts(transaction)) {
      if (part.categoryId === null) continue

      const existing = amounts.get(part.categoryId)

      if (existing) existing.push(part.amount)
      else amounts.set(part.categoryId, [part.amount])
    }
  }

  const typicals: CategoryTypical[] = []

  for (const [categoryId, values] of amounts) {
    const baseline = baselineOf(values, MIN_EXPENSES)

    if (baseline !== null) typicals.push({ categoryId, ...baseline })
  }

  return typicals
}

/**
 * Lo normal de una categoría concreta, o `null` si de ella no se sabe.
 *
 * Acepta un id nulo porque los movimientos pueden no tener categoría, y ahí la
 * respuesta es la misma que la de una categoría callada: no hay contra qué
 * comparar. Ninguna costumbre lleva id nulo, así que la búsqueda ya no encuentra
 * nada; no hace falta apartarlo antes.
 */
export function typicalOf(
  typicals: readonly CategoryTypical[],
  categoryId: string | null,
): Baseline | null {
  return typicals.find((typical) => typical.categoryId === categoryId) ?? null
}

/**
 * Cuántos vaivenes hacen raro un gasto.
 *
 * **Tres, y está medido.** El gasto no se reparte como el peso: hay muchos
 * pequeños y unos pocos grandes, así que el vaivén se queda corto por arriba.
 * Sobre 153 gastos reales, con dos —el umbral del peso— saltaría el 9 % de
 * ellos y sería ruido; con tres, el 3,8 %. Con cuatro baja al 0,8 % y ya no
 * pilla nada.
 */
const UNUSUAL_SPREADS = 3

/** Una parte de un gasto que se sale de lo normal en su categoría. */
export interface UnusualPart {
  /** La categoría de la parte, para nombrarla cuando el gasto va repartido. */
  readonly name: string
  readonly reading: AgainstTypical
}

/**
 * Las partes de un gasto que se salen de lo normal en su categoría.
 *
 * **Se calla casi siempre**, que es la condición para que signifique algo:
 * marcar cuatro de cada cien gastos hace mirar esos cuatro, y marcar la mitad
 * no hace mirar ninguno.
 *
 * Va por partes y no por movimiento porque un gasto repartido son dos gastos
 * distintos: los 40.000 de hogar de una compra no se comparan con lo que se
 * suele gastar en mercado.
 *
 * Un ingreso o un traspaso no se compara con nada: lo normal se saca de los
 * gastos, y un sueldo al lado de una compra no dice nada de ninguno de los dos.
 */
export function unusualParts(
  transaction: FinanceTransactionWithNames,
  typicals: readonly CategoryTypical[],
): readonly UnusualPart[] {
  if (transaction.kind !== 'expense') return []

  return transactionParts(transaction)
    .map((part) => ({
      name: part.name,
      reading: readingAgainstTypical(
        part.amount,
        typicalOf(typicals, part.categoryId),
        UNUSUAL_SPREADS,
      ),
    }))
    .filter((part): part is UnusualPart => part.reading?.isUnusual === true)
}

/** Lo que sueles gastar en un tramo de N días. */
export interface WindowTypical {
  /** Cuántos días mide el tramo: los mismos que enseña el panel. */
  readonly days: number
  readonly typical: Baseline
}

/**
 * Tramos completos que hacen falta para hablar de costumbre.
 *
 * Cinco. Con menos, el vaivén es el del azar y no el tuyo — el mismo motivo por
 * el que el mes no entra todavia en la comparación de gastos sueltos: con tres
 * meses de historia casi cualquier mes sale raro.
 */
const MIN_WINDOWS = 5

/** Días de historia que se miran, los mismos que traen las categorías. */
const WINDOW_HISTORY_DAYS = 180

/**
 * Cuánto sueles gastar en un tramo de cada tamaño.
 *
 * **Los tramos se cuentan hacia atrás desde ayer**, no desde hoy: el de hoy está
 * a medias, y meter medio tramo entre los completos bajaría «lo normal» cada
 * mañana.
 *
 * Sale de los mismos movimientos que ya se piden para las categorías, así que no
 * cuesta una consulta mas. Con 180 dias salen 25 semanas y 6 meses; los tramos
 * de 90 días se quedan en dos y por eso no dicen nada, que es lo correcto.
 */
export function windowTypicals(
  transactions: readonly FinanceTransactionWithNames[],
  today: Date,
  sizes: readonly number[],
): readonly WindowTypical[] {
  const expenses = transactions.filter((transaction) => transaction.kind === 'expense')
  const ayer = new Date(today)
  ayer.setDate(ayer.getDate() - 1)

  // El primer gasto marca dónde empieza la historia. Los tramos anteriores no
  // son semanas en las que no se gastó: son semanas en las que la persona no
  // usaba la aplicación, y contarlos como ceros hundiría la mediana hasta hacer
  // rara cualquier semana normal. Lo encontró una prueba.
  const primero = expenses.reduce<string | null>(
    (menor, { occurred_on }) => (menor === null || occurred_on < menor ? occurred_on : menor),
    null,
  )
  if (primero === null) return []

  const result: WindowTypical[] = []

  for (const days of sizes) {
    const totals: number[] = []

    for (let index = 0; index < Math.floor(WINDOW_HISTORY_DAYS / days); index += 1) {
      const end = new Date(ayer)
      end.setDate(end.getDate() - index * days)
      const start = new Date(end)
      start.setDate(start.getDate() - (days - 1))

      const startKey = toDateKey(start)
      // Solo cuentan los tramos enteros. Uno que empieza antes del primer gasto
      // está a medias —parte historia y parte nada— y contaría bajo.
      if (startKey < primero) break

      const endKey = toDateKey(end)
      const total = expenses
        .filter(({ occurred_on }) => occurred_on >= startKey && occurred_on <= endKey)
        .reduce((sum, { amount }) => sum + amount, 0)

      totals.push(total)
    }

    const typical = baselineOf(totals, MIN_WINDOWS)
    if (typical !== null) result.push({ days, typical })
  }

  return result
}

/** Lo normal de un tramo de ese tamaño, o `null` si de él no se sabe. */
export function windowTypicalOf(typicals: readonly WindowTypical[], days: number): Baseline | null {
  return typicals.find((typical) => typical.days === days)?.typical ?? null
}
