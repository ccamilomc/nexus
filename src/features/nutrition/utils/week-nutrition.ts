import { toDateKey, toDateKeyFromIso } from '@/shared/utils'

import type { Macros, MealItemSample, MealLogSample, WeekNutrition } from '../types/nutrition.types'
import { macrosForItems } from './macros'

/**
 * Días con registro por debajo de los cuales no se promedia nada.
 *
 * Con uno solo, la «media de la semana» es literalmente el día de hoy, que ya
 * está justo encima en la pantalla; repetirlo con otro nombre no informa,
 * confunde.
 */
export const MIN_DAYS_FOR_WEEK = 2

/**
 * Cómo va la semana de comida, en medias por día.
 *
 * Es la pregunta que el total de hoy no puede contestar: quedarse corto de
 * proteína un día no significa nada, y cuatro seguidos son un patrón. El mismo
 * motivo por el que Estudio tiene su tarjeta de la semana.
 *
 * **Se promedia sobre los días registrados, no sobre siete.** Un día sin
 * comidas apuntadas es un día que no se registró, no un día de ayuno: repartir
 * entre siete cuando hay tres haría decir «comes 800 kcal al día», que es
 * mentira. Es el mismo criterio de huecos que ya usa la serie de Analytics.
 *
 * Por eso se devuelve también `daysLogged`: una media de dos días y otra de
 * siete no merecen la misma confianza, y quien la lee tiene derecho a saberlo.
 *
 * Devuelve `null` cuando no hay días suficientes, en vez de un promedio que no
 * dice nada.
 */
export function buildWeekNutrition(
  mealLogs: readonly MealLogSample[],
  items: readonly MealItemSample[],
  days: readonly Date[],
  today: Date,
): WeekNutrition | null {
  const inWeek = new Set(days.map(toDateKey))
  const itemsByLog = new Map<string, MealItemSample[]>()

  for (const item of items) {
    const current = itemsByLog.get(item.meal_log_id)
    if (current) current.push(item)
    else itemsByLog.set(item.meal_log_id, [item])
  }

  const byDay = new Map<string, Macros>()

  for (const log of mealLogs) {
    const dateKey = toDateKeyFromIso(log.logged_at)
    if (!inWeek.has(dateKey)) continue

    const logItems = itemsByLog.get(log.id) ?? []
    // Una comida creada y vacía no es un día registrado: metería un cero que
    // hundiría la media.
    if (logItems.length === 0) continue

    byDay.set(dateKey, addMacros(byDay.get(dateKey), macrosForItems(logItems)))
  }

  const daysLogged = byDay.size
  if (daysLogged < MIN_DAYS_FOR_WEEK) return null

  const total = [...byDay.values()].reduce(addMacros, undefined)
  if (!total) return null

  return {
    daysLogged,
    daysElapsed: elapsedDays(days, today),
    averages: {
      calories: round(total.calories / daysLogged),
      proteinG: round(total.proteinG / daysLogged),
      carbsG: round(total.carbsG / daysLogged),
      fatG: round(total.fatG / daysLogged),
    },
  }
}

/**
 * Días de la semana que ya han llegado, contando hoy.
 *
 * **Un día que no ha llegado no es un día sin apuntar.** El contador dice qué
 * tan sólida es la media, y el martes «2 de 7» hace parecer floja una semana
 * apuntada entera hasta ese momento. Es lo que ya hacen Estudio —«2 h 25 min al
 * día para llegar el domingo»— y Finanzas —«va el 48 % del mes»—: las dos saben
 * que el tramo está a medias.
 *
 * Hoy cuenta aunque esté a medias: si no se ha apuntado nada todavía, es un día
 * sin apuntar de verdad, y el total de hoy está justo encima diciéndolo.
 */
function elapsedDays(days: readonly Date[], today: Date): number {
  const todayKey = toDateKey(today)

  return days.filter((day) => toDateKey(day) <= todayKey).length
}

function addMacros(current: Macros | undefined, next: Macros): Macros {
  if (!current) return next

  return {
    calories: current.calories + next.calories,
    proteinG: current.proteinG + next.proteinG,
    carbsG: current.carbsG + next.carbsG,
    fatG: current.fatG + next.fatG,
  }
}

/** Un decimal: promediar tres días no da precisión para más. */
function round(value: number): number {
  return Math.round(value * 10) / 10
}
