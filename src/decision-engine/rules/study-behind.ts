import type { DailyContext } from '../contracts/context.types'
import type { Recommendation } from '../contracts/recommendation.types'
import type { Rule } from '../contracts/rule.types'
import { weekdayPosition } from './time'

const DAYS_PER_WEEK = 7

/**
 * Margen antes de avisar: hasta un 20 % por debajo del ritmo se considera el
 * vaivén normal de una semana, no un retraso.
 */
const TOLERANCE = 0.8

/** Desde el último día de la semana, el aviso ya es urgente. */
const LAST_DAY = 7

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

/**
 * Avisa cuando el estudio de la semana va por debajo del ritmo necesario.
 *
 * No compara con el objetivo entero —el lunes nadie lo ha cumplido— sino con la
 * parte que tocaría a estas alturas de la semana. Así el aviso llega cuando aún
 * se puede reaccionar, que es lo único que lo hace útil.
 *
 * **No aplica el lunes**: con un solo día vivido no hay evidencia de retraso,
 * sólo de que la semana acaba de empezar.
 */
export const studyBehindRule: Rule = {
  id: 'study-behind@1',

  appliesTo(context: DailyContext): boolean {
    const target = context.goals.studyWeeklyMinutes ?? 0
    if (target <= 0) return false

    const day = weekdayPosition(context.date)
    if (day < 2) return false

    return context.study.weekMinutes < expectedByNow(target, day) * TOLERANCE
  },

  evaluate(context: DailyContext): readonly Recommendation[] {
    const target = context.goals.studyWeeklyMinutes ?? 0
    const day = weekdayPosition(context.date)
    const remaining = Math.max(0, target - context.study.weekMinutes)
    const daysLeft = DAYS_PER_WEEK - day

    return [
      {
        type: 'alert',
        domain: 'study',
        priority: day >= LAST_DAY ? 'high' : 'medium',
        title: 'Vas por debajo de tu ritmo de estudio',
        message:
          daysLeft === 0
            ? `Hoy acaba la semana y te faltan ${formatMinutes(remaining)}.`
            : `Te faltan ${formatMinutes(remaining)} y quedan ${daysLeft} ${
                daysLeft === 1 ? 'día' : 'días'
              }.`,
        reason: `Llevas ${formatMinutes(context.study.weekMinutes)} de ${formatMinutes(target)}; a estas alturas de la semana tocarían unos ${formatMinutes(Math.round(expectedByNow(target, day)))}.`,
        data: { remainingMinutes: remaining, daysLeft, weekMinutes: context.study.weekMinutes },
      },
    ]
  },
}

/** Parte del objetivo que tocaría llevar el día `day` de la semana. */
function expectedByNow(target: number, day: number): number {
  return (target * day) / DAYS_PER_WEEK
}
