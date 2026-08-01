import type { DailyContext } from '../contracts/context.types'
import type { Recommendation } from '../contracts/recommendation.types'
import type { Rule } from '../contracts/rule.types'
import { hoursBetween } from './time'

/**
 * Horas a partir de las cuales un entrenamiento «en curso» ya no lo está.
 *
 * Nadie entrena seis horas seguidas: pasado ese rato, lo que hay es una sesión
 * que se quedó abierta, no alguien en el gimnasio.
 */
const STALE_HOURS = 6

const HOURS_PER_DAY = 24

function describeAge(hours: number): string {
  if (hours < HOURS_PER_DAY) return `${hours} horas`

  const days = Math.floor(hours / HOURS_PER_DAY)
  return days === 1 ? 'un día' : `${days} días`
}

/**
 * Avisa de un entrenamiento que se quedó abierto.
 *
 * Sin esto el sistema se contradice: la pantalla de entrenar muestra una sesión
 * en curso con el cronómetro disparado, mientras el plan dice «llevas días sin
 * entrenar» —porque una sesión sin terminar no cuenta como entrenamiento—. El
 * aviso saca a la luz el enganche para que el usuario lo cierre o lo descarte.
 */
export const workoutOpenSessionRule: Rule = {
  id: 'workout-open-session@1',

  appliesTo(context: DailyContext): boolean {
    const startedAt = context.workout.activeSessionStartedAt
    if (startedAt === undefined) return false

    return hoursBetween(startedAt, context.now) >= STALE_HOURS
  },

  evaluate(context: DailyContext): readonly Recommendation[] {
    const startedAt = context.workout.activeSessionStartedAt
    if (startedAt === undefined) return []

    const hours = hoursBetween(startedAt, context.now)

    return [
      {
        key: 'workout-open-session@1',
        type: 'alert',
        domain: 'workout',
        priority: 'medium',
        title: 'Tienes un entrenamiento sin cerrar',
        message: 'Termínalo o descártalo: mientras siga abierto no cuenta en tu historial.',
        reason: `Lo empezaste hace ${describeAge(hours)} y sigue en curso.`,
        data: { hours, startedAt },
      },
    ]
  },
}
