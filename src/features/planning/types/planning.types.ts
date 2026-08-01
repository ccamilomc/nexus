import type { Json } from '@/core/supabase'

/**
 * Tipos del plan del día.
 *
 * El plan no guarda las recomendaciones que muestra: se recalculan al vuelo en
 * cada visita porque dependen de lo registrado hasta ese momento. Lo único que
 * se persiste es lo que el usuario **decidió**, que es lo que el motor no puede
 * volver a deducir.
 */

/** Fila mínima de un descarte: sólo hace falta su carga para leer la clave. */
export interface DismissedRow {
  readonly id: string
  readonly data: Json
}
