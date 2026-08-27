import { previousDay, toDateKey } from '@/shared/utils'

import type { HabitLog } from '../types/habits.types'

/**
 * Cuántos días seguidos sin que toque nada antes de darse por vencido.
 *
 * **Es un tope de días saltados, no de días contados**, y la diferencia importa:
 * con un tope de días mirados, una racha de 500 días se quedaría en el tope y la
 * cifra sería falsa. Aquí una racha larga se cuenta entera, y lo único que se
 * corta es la búsqueda cuando lleva mucho sin encontrar un día que toque.
 *
 * Catorce días son dos semanas: cualquier reparto por días de la semana vuelve a
 * tocar dentro de siete, así que sólo se llega a este tope cuando ya no hay nada
 * que encontrar.
 */
const MAX_DAYS_SKIPPED = 14

/**
 * Racha actual: días seguidos cumplidos **de los que tocaban**, hasta hoy.
 *
 * Regla clave: **si hoy todavía no está marcado, la racha no se rompe**. El día
 * no ha terminado, así que se cuenta desde ayer. Ver a cero una racha de 30 días
 * a las 9 de la mañana desmotiva y además es falso: aún no has fallado.
 *
 * **Los días que no tocan se saltan: ni cuentan ni rompen.** Un hábito de lunes,
 * miércoles y viernes tiene su racha viva el martes — el martes no se falló, es
 * que no había nada que hacer. Sin esto, la racha de cualquier hábito que no
 * fuera diario se rompía sola cada dos días.
 *
 * Sí se rompe en cuanto falta un día que **sí** tocaba: ahí se dejó de hacer.
 *
 * `applies` llega desde fuera, ya atado a su hábito, para que esta función no
 * tenga que conocerlo: lo único que necesita saber es si un día cuenta.
 */
export function calculateStreak(
  completedDates: ReadonlySet<string>,
  today: Date,
  applies: (date: Date) => boolean = () => true,
): number {
  // Si hoy está hecho, la racha lo incluye; si no, se mide hasta ayer.
  let cursor = completedDates.has(toDateKey(today)) ? today : previousDay(today)
  let streak = 0
  let skipped = 0

  while (skipped < MAX_DAYS_SKIPPED) {
    if (applies(cursor)) {
      if (!completedDates.has(toDateKey(cursor))) break

      streak += 1
      skipped = 0
    } else {
      skipped += 1
    }

    cursor = previousDay(cursor)
  }

  return streak
}

/**
 * ¿Algún hábito tiene cumplido ese día?
 *
 * Sirve para saber si merece la pena mirar más atrás en el historial: si el día
 * más antiguo que se ha traído está cumplido, esa racha puede venir de antes y
 * contarla con lo que hay la dejaría corta.
 */
export function hasCompletedOn(logs: readonly HabitLog[], dateKey: string): boolean {
  return logs.some((log) => log.completed && log.date === dateKey)
}
