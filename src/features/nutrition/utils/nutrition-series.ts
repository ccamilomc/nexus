import { seriesAverage, seriesTotal, toDateKey, toDateKeyFromIso } from '@/shared/utils'

import type {
  MealItemSample,
  MealLogSample,
  NutritionPeriodSeries,
  WaterSample,
} from '../types/nutrition.types'
import { macrosForItems } from './macros'

/**
 * Arma la serie de nutrición de un periodo y las cifras del tramo anterior.
 *
 * Aquí los días sin registro son **huecos, no ceros**: nadie come cero
 * calorías. Un día sin comidas apuntadas es un día que no se registró, y
 * meterlo como cero hundiría la media hasta volverla mentira. Es el mismo
 * criterio que en sueño, y el contrario que en entrenamiento, donde no haber
 * apuntado sí significa no haber entrenado.
 */
export function buildNutritionSeries(
  mealLogs: readonly MealLogSample[],
  items: readonly MealItemSample[],
  waterLogs: readonly WaterSample[],
  days: readonly Date[],
  previousDays: readonly Date[],
  /** El objetivo vigente, para poder dibujar contra que se compara. */
  calorieTarget: number | null,
): NutritionPeriodSeries {
  const itemsByLog = groupItemsByLog(items)

  const current = summarize(mealLogs, itemsByLog, waterLogs, days)
  const previous = summarize(mealLogs, itemsByLog, waterLogs, previousDays)

  return {
    caloriePoints: current.caloriePoints,
    averageCalories: current.averageCalories,
    previousAverageCalories: previous.averageCalories,
    daysLogged: current.daysLogged,
    averageWaterMl: current.averageWaterMl,
    previousAverageWaterMl: previous.averageWaterMl,
    calorieTarget,
  }
}

function groupItemsByLog(items: readonly MealItemSample[]): Map<string, MealItemSample[]> {
  const byLog = new Map<string, MealItemSample[]>()

  for (const item of items) {
    const current = byLog.get(item.meal_log_id)
    if (current) current.push(item)
    else byLog.set(item.meal_log_id, [item])
  }

  return byLog
}

function summarize(
  mealLogs: readonly MealLogSample[],
  itemsByLog: ReadonlyMap<string, MealItemSample[]>,
  waterLogs: readonly WaterSample[],
  days: readonly Date[],
) {
  const inPeriod = new Set(days.map(toDateKey))

  const caloriesByDate = new Map<string, number>()

  for (const log of mealLogs) {
    const dateKey = toDateKeyFromIso(log.logged_at)
    if (!inPeriod.has(dateKey)) continue

    const logItems = itemsByLog.get(log.id) ?? []
    // Una comida vacía —creada y sin alimentos— no cuenta como día registrado:
    // marcaría el día a cero calorías y arrastraría la media hacia abajo.
    if (logItems.length === 0) continue

    caloriesByDate.set(
      dateKey,
      (caloriesByDate.get(dateKey) ?? 0) + macrosForItems(logItems).calories,
    )
  }

  const caloriePoints = days.map((day) => {
    const dateKey = toDateKey(day)
    const calories = caloriesByDate.get(dateKey)

    return { dateKey, value: calories === undefined ? null : Math.round(calories) }
  })

  const mlByDate = new Map<string, number>()
  for (const log of waterLogs) {
    const dateKey = toDateKeyFromIso(log.logged_at)
    if (!inPeriod.has(dateKey)) continue

    mlByDate.set(dateKey, (mlByDate.get(dateKey) ?? 0) + log.amount_ml)
  }

  const waterPoints = days.map((day) => {
    const dateKey = toDateKey(day)
    const ml = mlByDate.get(dateKey)

    return { dateKey, value: ml === undefined ? null : ml }
  })

  return {
    caloriePoints,
    averageCalories: roundOrNull(seriesAverage(caloriePoints)),
    daysLogged: caloriesByDate.size,
    averageWaterMl: roundOrNull(seriesAverage(waterPoints)),
    totalCalories: seriesTotal(caloriePoints),
  }
}

function roundOrNull(value: number | null): number | null {
  return value === null ? null : Math.round(value)
}
