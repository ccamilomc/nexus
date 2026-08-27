import type { DailyContext } from '../contracts/context.types'
import type { Recommendation } from '../contracts/recommendation.types'
import type { Rule } from '../contracts/rule.types'
import { formatMinutes } from './format'
import { weekdayPosition } from './time'

const DAYS_PER_WEEK = 7

/**
 * Margen antes de avisar: hasta un 20 % por debajo del ritmo se considera el
 * vaivén normal de una semana, no un retraso.
 */
const TOLERANCE = 0.8

/** Desde el último día de la semana, el aviso ya es urgente. */
const LAST_DAY = 7

/**
 * Días que quedan de semana, **contando hoy**.
 *
 * Decía uno menos, y el sábado por la mañana avisaba de que «queda 1 día»
 * cuando aún quedaban dos: hoy también se puede estudiar. Además chocaba con lo
 * que enseñaba la propia pantalla de Estudio, que sí lo cuenta
 * (`features/study/utils/weekly-pace.ts`).
 *
 * El motor es puro y no puede tirar de la feature (ADR-0002), así que el
 * cálculo está escrito dos veces a propósito. **Si cambia uno, cambia el otro**:
 * son la misma cifra vista desde dos pantallas, y el usuario las ve seguidas.
 */
function daysLeftInWeek(day: number): number {
  return DAYS_PER_WEEK - day + 1
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
    const daysLeft = daysLeftInWeek(day)

    return [
      {
        key: 'study-behind@1',
        type: 'alert',
        domain: 'study',
        priority: day >= LAST_DAY ? 'high' : 'medium',
        title: 'Vas por debajo de tu ritmo de estudio',
        // Repartido entre los días que quedan, que es lo que se puede hacer hoy.
        // Mismas palabras que la pantalla de Estudio: es la misma cifra, y verla
        // dicha de dos maneras hace dudar de las dos.
        message:
          daysLeft === 1
            ? `Hoy acaba la semana y te faltan ${formatMinutes(remaining)}.`
            : `Te faltan ${formatMinutes(remaining)}: ${formatMinutes(
                Math.ceil(remaining / daysLeft),
              )} al día para llegar el domingo.`,
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
