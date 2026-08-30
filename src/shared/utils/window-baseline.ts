import { type Baseline, baselineOf } from './baseline'
import { toDateKey } from './date-key'

/** Algo que pasó un día y se puede sumar: un gasto, unos minutos, unos kilos. */
export interface DatedValue {
  /** El día en `YYYY-MM-DD`. */
  readonly date: string
  readonly value: number
}

/** Lo normal en un tramo de N días. */
export interface WindowBaseline {
  /** Cuántos días mide el tramo: los mismos que enseña el panel. */
  readonly days: number
  readonly typical: Baseline
}

/**
 * Tramos completos que hacen falta para hablar de costumbre.
 *
 * Cinco. Con menos, el vaivén es el del azar y no el tuyo — el mismo motivo por
 * el que el mes todavía no entra en la comparación de gastos sueltos: con tres
 * meses de historia casi cualquier mes sale raro.
 */
const MIN_WINDOWS = 5

/**
 * Tamaños de tramo para los que cada dominio calcula lo normal.
 *
 * **Son los tres periodos que compara el panel.** Vive aquí y no en `dashboard`
 * porque lo usan tres features, y ninguna puede importar de otra; si el panel
 * añade un cuarto periodo, se añade aquí y los tres lo calculan.
 */
export const COMPARABLE_WINDOWS: readonly number[] = [7, 30, 90]

/** Días de historia que se miran. Los mismos que trae cada consulta. */
const HISTORY_DAYS = 180

/**
 * Cuánto sueles acumular en un tramo de cada tamaño.
 *
 * Sirve para contestar «¿esta semana fue rara?» sin compararla con la semana
 * pasada, que es **una muestra de uno**: si la anterior fue rara, la corriente
 * parece noticia. Sobre datos reales las dos referencias discrepan en más de la
 * mitad de las semanas.
 *
 * **Los tramos se cuentan hacia atrás desde ayer**, no desde hoy: el de hoy está
 * a medias, y meter medio tramo entre los completos bajaría «lo normal» cada
 * mañana.
 *
 * **Sólo cuentan los tramos enteramente dentro de la historia.** Los anteriores
 * al primer registro no son semanas en las que no se hizo nada: son semanas en
 * las que la persona no usaba la aplicación, y contarlas como ceros hundiría la
 * mediana hasta hacer rara cualquier semana normal. Lo encontró una prueba.
 *
 * Devuelve sólo los tamaños de los que se sabe algo. Con 180 días de historia
 * salen unas 25 semanas y 6 meses; los tramos de 90 días se quedan en dos, y por
 * eso no dicen nada — que es lo correcto: ahí quien pregunte se compara con el
 * tramo anterior, como siempre.
 */
export function windowBaselines(
  samples: readonly DatedValue[],
  today: Date,
  sizes: readonly number[],
): readonly WindowBaseline[] {
  const ayer = new Date(today)
  ayer.setDate(ayer.getDate() - 1)

  const first = samples.reduce<string | null>(
    (menor, { date }) => (menor === null || date < menor ? date : menor),
    null,
  )
  if (first === null) return []

  const result: WindowBaseline[] = []

  for (const days of sizes) {
    const totals: number[] = []

    for (let index = 0; index < Math.floor(HISTORY_DAYS / days); index += 1) {
      const end = new Date(ayer)
      end.setDate(end.getDate() - index * days)
      const start = new Date(end)
      start.setDate(start.getDate() - (days - 1))

      const startKey = toDateKey(start)
      // Uno que empieza antes del primer registro está a medias —parte historia
      // y parte nada— y contaría bajo.
      if (startKey < first) break

      const endKey = toDateKey(end)
      const total = samples
        .filter(({ date }) => date >= startKey && date <= endKey)
        .reduce((sum, { value }) => sum + value, 0)

      totals.push(total)
    }

    const typical = baselineOf(totals, MIN_WINDOWS)
    if (typical !== null) result.push({ days, typical })
  }

  return result
}

/** Lo normal de un tramo de ese tamaño, o `null` si de él no se sabe. */
export function windowBaselineOf(
  baselines: readonly WindowBaseline[],
  days: number,
): Baseline | null {
  return baselines.find((baseline) => baseline.days === days)?.typical ?? null
}
