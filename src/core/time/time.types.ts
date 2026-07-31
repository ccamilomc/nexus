/**
 * El reloj de la aplicación.
 *
 * Una sola fuente para «qué hora es» y «qué día es hoy». Antes cada pantalla
 * calculaba su propia fecha al montarse, así que dos partes de la interfaz
 * podían discrepar y ninguna se enteraba del cambio de día.
 */
export interface TimeContextValue {
  /** Instante actual. Se refresca cada hora en punto y al volver a la app. */
  readonly now: Date
  /**
   * Medianoche local de hoy: **el día, no el instante**.
   *
   * La referencia sólo cambia cuando cambia el día, así que sirve de dependencia
   * y de clave de consulta sin provocar trabajo de más.
   */
  readonly today: Date
}
