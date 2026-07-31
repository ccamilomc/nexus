import type { DailyContext } from '../contracts/context.types'
import type { Recommendation } from '../contracts/recommendation.types'
import type { Rule } from '../contracts/rule.types'

/** Por debajo de seis horas, casi nadie rinde igual. */
const SHORT_SLEEP_MINUTES = 6 * 60

/** Por debajo de cinco, el aviso deja de ser un matiz. */
const VERY_SHORT_SLEEP_MINUTES = 5 * 60

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  if (hours === 0) return `${rest} min`
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

/**
 * Ajusta el día cuando se ha dormido poco.
 *
 * Es la primera regla que **cruza dos dominios**: mira el sueño para hablar del
 * entrenamiento. Ahí empieza a haber criterio y no sólo recordatorios.
 *
 * Sugiere sin afirmar: dice el dato («dormiste 5 h 20 min») y propone bajar el
 * volumen, sin prometer resultados ni dar consejo médico. Nexus recomienda; el
 * usuario decide (ver docs/06).
 */
export const sleepShortRule: Rule = {
  id: 'sleep-short@1',

  appliesTo(context: DailyContext): boolean {
    const minutes = context.sleep.lastNightMinutes
    return minutes !== undefined && minutes < SHORT_SLEEP_MINUTES
  },

  evaluate(context: DailyContext): readonly Recommendation[] {
    const minutes = context.sleep.lastNightMinutes
    if (minutes === undefined) return []

    return [
      {
        type: 'insight',
        domain: 'sleep',
        priority: minutes < VERY_SHORT_SLEEP_MINUTES ? 'high' : 'medium',
        title: 'Anoche dormiste poco',
        message: 'Si hoy entrenas, plantéate bajar el volumen o acortar la sesión.',
        reason: `Dormiste ${formatMinutes(minutes)}, por debajo de las 6 h.`,
        data: { minutes },
      },
    ]
  },
}
