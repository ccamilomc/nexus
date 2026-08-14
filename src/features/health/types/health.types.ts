import type { Enums, Tables } from '@/core/supabase'
import type { SeriesPoint } from '@/shared/utils'

/**
 * Tipos del dominio de salud.
 *
 * Como en el resto del proyecto, las filas se usan tal cual las genera Supabase
 * y encima se definen los agregados que necesita la interfaz.
 */

export type BodyMetric = Tables<'body_metrics'>
export type BodyMetricType = Enums<'body_metric_type'>

/**
 * Una medida con su última lectura y lo que ha cambiado.
 *
 * `change` es la diferencia con la medición anterior; `null` si sólo hay una.
 * **No lleva juicio**: subir o bajar de peso no es bueno ni malo sin saber qué
 * persigue quien lo mide (ver docs/11-ux-ui-y-diseno.md).
 */
export interface MetricSummary {
  readonly type: BodyMetricType
  readonly latest: BodyMetric
  readonly change: number | null
  /** Medición con la que se compara; `null` si es la primera. */
  readonly previous: BodyMetric | null
}

/**
 * Una lectura del histórico, con lo que cambió respecto a la anterior.
 *
 * El cambio se calcula aquí y no en la pantalla: es la misma resta que ya hace
 * el resumen, y repetirla en un componente sería tener dos sitios donde puede
 * salir distinta. Como allí, **no lleva juicio**.
 */
export interface MetricReading {
  readonly id: string
  readonly value: number
  readonly unit: string
  readonly measuredAt: string
  /** Diferencia con la lectura anterior; `null` en la más antigua que se trajo. */
  readonly change: number | null
}

/**
 * Cómo ha ido una medida.
 *
 * **La tendencia se compara entre los extremos del tramo traído**, no entre las
 * dos últimas: eso ya lo dice el resumen. Aquí la pregunta es otra —«¿voy a
 * algún sitio?»— y se responde mirando de dónde se venía.
 */
export interface MetricHistory {
  readonly type: BodyMetricType
  /** De la más reciente a la más antigua, que es como se lee. */
  readonly readings: readonly MetricReading[]
  /** Diferencia entre la primera lectura del tramo y la última. `null` con una sola. */
  readonly totalChange: number | null
  readonly unit: string
}

/**
 * Hacia dónde va el peso, ya sin el ruido del día a día.
 *
 * Como el resto de Salud **no opina**: `direction` dice si sube o baja, no si
 * está bien o mal. Va en gris, sin flechas ni colores, igual que las
 * comparativas (ver docs/11-ux-ui-y-diseno.md).
 *
 * Se acompaña de las medias y de cuántas pesadas las forman: una tendencia
 * calculada con dos pesadas contra dos no merece la misma confianza que una
 * con seis, y quien la lee tiene derecho a saberlo.
 */
export interface WeightTrend {
  readonly direction: 'up' | 'down' | 'stable'
  /** Cambio semanal con signo; negativo es a la baja. */
  readonly kgPerWeek: number
  readonly recentAverage: number
  readonly previousAverage: number
  readonly recentCount: number
  readonly previousCount: number
  /** Días que abarca cada ventana, para poder contarlo en pantalla. */
  readonly windowDays: number
}

/**
 * Índice de masa corporal.
 *
 * Se **calcula** a partir del peso y la altura del perfil; nunca se almacena
 * (ver docs/04-modelo-de-datos.md).
 */
export interface Bmi {
  readonly value: number
  /** Categoría de la OMS, como referencia general. */
  readonly category: string
}

/**
 * El peso de un periodo, tal y como lo consume Analytics.
 *
 * Como el resto de Salud, **no opina**: hay una serie y una resta, y ni una
 * flecha, ni un color, ni un objetivo. El motor tampoco tiene reglas sobre el
 * peso, y esto no las introduce por la puerta de atrás.
 */
export interface WeightPeriodSeries {
  /** Peso de cada día; hueco donde no hubo medición. */
  readonly points: readonly SeriesPoint[]
  /** Días con al menos una medición. */
  readonly measurements: number
  /** La última medición del periodo; `null` si no hubo ninguna. */
  readonly latestKg: number | null
  /** Diferencia entre la primera y la última; `null` si sólo hay una. */
  readonly changeKg: number | null
  /** Unidad guardada en las mediciones (`kg`). */
  readonly unit: string
}
