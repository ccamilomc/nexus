import type { DailyContext } from '../contracts/context.types'
import type { Recommendation } from '../contracts/recommendation.types'
import type { Rule } from '../contracts/rule.types'
import { hourOf } from './time'

/** A partir de esta hora, un hábito sin marcar ya es una racha en juego. */
const EVENING_HOUR = 20

/**
 * Avisa de los hábitos que siguen sin marcar.
 *
 * No recrimina: sólo dice cuántos quedan. La gamificación motiva, nunca castiga
 * (ver docs/11-ux-ui-y-diseno.md), así que el mensaje habla de lo que queda por
 * hacer, no de lo que se ha fallado.
 */
export const habitsPendingRule: Rule = {
  id: 'habits-pending@1',

  appliesTo(context: DailyContext): boolean {
    return context.habits.total > 0 && context.habits.done < context.habits.total
  },

  evaluate(context: DailyContext): readonly Recommendation[] {
    const pending = context.habits.total - context.habits.done
    const isLate = hourOf(context.now) >= EVENING_HOUR

    return [
      {
        key: 'habits-pending@1',
        type: 'alert',
        domain: 'habit',
        priority: isLate ? 'high' : 'medium',
        title: pending === 1 ? 'Te queda 1 hábito' : `Te quedan ${pending} hábitos`,
        message:
          pending === 1
            ? 'Marca el que falta para cerrar el día.'
            : 'Márcalos para cerrar el día completo.',
        reason: `Llevas ${context.habits.done} de ${context.habits.total} hoy${
          isLate ? ', y la noche ya está avanzada' : ''
        }.`,
        data: { pending, total: context.habits.total },
      },
    ]
  },
}
