import { previousDay, toDateKey } from './date-key'

/**
 * Racha actual: días consecutivos cumplidos que llegan hasta hoy.
 *
 * Regla clave: **si hoy todavía no está marcado, la racha no se rompe**. El día
 * no ha terminado, así que se cuenta desde ayer. Ver a cero una racha de 30 días
 * a las 9 de la mañana desmotiva y además es falso: aún no has fallado.
 *
 * Sí se rompe en cuanto falta un día anterior: ahí el hábito se dejó de hacer.
 */
export function calculateStreak(completedDates: ReadonlySet<string>, today: Date): number {
  // Si hoy está hecho, la racha lo incluye; si no, se mide hasta ayer.
  let cursor = completedDates.has(toDateKey(today)) ? today : previousDay(today)
  let streak = 0

  while (completedDates.has(toDateKey(cursor))) {
    streak += 1
    cursor = previousDay(cursor)
  }

  return streak
}
