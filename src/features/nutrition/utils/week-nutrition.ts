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
    daysInWeek: days.length,
    averages: {
      calories: round(total.calories / daysLogged),
      proteinG: round(total.proteinG / daysLogged),
      carbsG: round(total.carbsG / daysLogged),
      fatG: round(total.fatG / daysLogged),
    },
  }
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
