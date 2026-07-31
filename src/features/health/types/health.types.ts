import type { Enums, Tables } from '@/core/supabase'

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
