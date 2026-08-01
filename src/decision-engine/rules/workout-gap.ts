import type { DailyContext } from '../contracts/context.types'
import type { Recommendation } from '../contracts/recommendation.types'
import type { Rule } from '../contracts/rule.types'
import { daysBetween, formatDateKey } from './time'

/**
 * Días de descanso a partir de los cuales se avisa.
 *
 * Dos días seguidos sin entrenar son descanso normal; a partir del tercero, la
 * pausa empieza a costar y conviene decirlo.
 */
const GAP_DAYS = 3

/** Una semana entera parada ya es dejarlo, no descansar. */
const LONG_GAP_DAYS = 7

/** Fecha del entrenamiento más reciente, o `null` si no hay ninguno. */
function lastSessionDate(context: DailyContext): string | null {
  const dates = context.workout.recentSessions.map((session) => session.date).sort()
  return dates.at(-1) ?? null
}

/**
 * Avisa de cuántos días se lleva sin entrenar.
 *
 * Sin ningún entrenamiento registrado **no dice nada**: quien todavía no ha
 * empezado no necesita que le recuerden que no ha empezado.
 */
export const workoutGapRule: Rule = {
  id: 'workout-gap@1',

  appliesTo(context: DailyContext): boolean {
    const last = lastSessionDate(context)
    return last !== null && daysBetween(last, context.date) >= GAP_DAYS
  },

  evaluate(context: DailyContext): readonly Recommendation[] {
    const last = lastSessionDate(context)
    if (last === null) return []

    const days = daysBetween(last, context.date)

    return [
      {
        key: 'workout-gap@1',
        type: 'alert',
        domain: 'workout',
        priority: days >= LONG_GAP_DAYS ? 'high' : 'medium',
        title: `Llevas ${days} días sin entrenar`,
        message: 'Retomarlo hoy, aunque sea corto, cuesta menos que empezar de cero.',
        reason: `Tu último entrenamiento fue el ${formatDateKey(last)}.`,
        data: { days, lastSessionDate: last },
      },
    ]
  },
}
