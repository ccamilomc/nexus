import type { DailyContext } from '../contracts/context.types'
import type { Recommendation } from '../contracts/recommendation.types'
import type { Rule } from '../contracts/rule.types'
import { hourOf } from './time'

/** A partir de esta hora, lo que falte por beber ya corre prisa. */
const EVENING_HOUR = 19

/** Litro en mililitros, para redondear el mensaje a una cifra legible. */
const ML_PER_LITER = 1000

function describeVolume(ml: number): string {
  if (ml < ML_PER_LITER) return `${ml} ml`

  const liters = Math.round((ml / ML_PER_LITER) * 10) / 10
  return `${liters.toString().replace('.', ',')} L`
}

/**
 * Recuerda el agua que falta para el objetivo del día.
 *
 * Sube a prioridad alta al caer la tarde: a las nueve de la mañana faltar un
 * litro es normal, a las nueve de la noche significa que el día se acaba sin
 * cumplirlo.
 */
export const waterPendingRule: Rule = {
  id: 'water-pending@1',

  appliesTo(context: DailyContext): boolean {
    const target = context.goals.nutrition?.waterMl ?? 0
    return target > 0 && context.nutrition.todayWaterMl < target
  },

  evaluate(context: DailyContext): readonly Recommendation[] {
    const target = context.goals.nutrition?.waterMl ?? 0
    const remaining = target - context.nutrition.todayWaterMl
    const isLate = hourOf(context.now) >= EVENING_HOUR

    return [
      {
        key: 'water-pending@1',
        type: 'alert',
        domain: 'nutrition',
        priority: isLate ? 'high' : 'medium',
        title: 'Te falta agua',
        message: `Bebe ${describeVolume(remaining)} para llegar a tu objetivo de hoy.`,
        reason: isLate
          ? `Llevas ${describeVolume(context.nutrition.todayWaterMl)} de ${describeVolume(target)} y el día se acaba.`
          : `Llevas ${describeVolume(context.nutrition.todayWaterMl)} de ${describeVolume(target)}.`,
        data: { remainingMl: remaining, targetMl: target },
      },
    ]
  },
}
