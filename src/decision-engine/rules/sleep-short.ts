import type { DailyContext } from '../contracts/context.types'
import type { Recommendation } from '../contracts/recommendation.types'
import type { Rule } from '../contracts/rule.types'
import { formatMinutes } from './format'

/**
 * Umbral por defecto, para quien no ha dicho cuánto quiere dormir.
 *
 * Es una referencia general, no un diagnóstico: por debajo de seis horas casi
 * nadie rinde igual. Sólo se usa **a falta de objetivo propio**.
 */
const SHORT_SLEEP_MINUTES = 6 * 60

/**
 * Cuánto hay que quedarse corto respecto al objetivo para que valga decirlo.
 *
 * Media hora de menos no es dormir poco, es una noche normal. Sin este margen,
 * un objetivo de 8 h convertiría en aviso cualquier noche de 7 h 45 min y la
 * regla acabaría hablando todos los días —que es la forma más rápida de que
 * dejen de leerla—.
 */
const TOLERANCE_MINUTES = 45

/** Quedarse a más de una hora del objetivo ya no es un matiz. */
const SERIOUS_GAP_MINUTES = 60

/**
 * Ajusta el día cuando se ha dormido poco.
 *
 * Es la primera regla que **cruza dos dominios**: mira el sueño para hablar del
 * entrenamiento. Ahí empieza a haber criterio y no sólo recordatorios.
 *
 * **Mide contra el objetivo del usuario cuando lo hay.** Antes usaba seis horas
 * para todo el mundo, así que a quien duerme siete y necesita ocho no le decía
 * nada, y a quien se apaña con cinco y media le avisaba cada mañana. Cuánto es
 * poco depende de cada uno, y el dato lo tiene el usuario, no Nexus.
 *
 * Sugiere sin afirmar: dice el dato («dormiste 5 h 20 min») y propone bajar el
 * volumen, sin prometer resultados ni dar consejo médico. Nexus recomienda; el
 * usuario decide (ver docs/06).
 */
export const sleepShortRule: Rule = {
  id: 'sleep-short@1',

  appliesTo(context: DailyContext): boolean {
    return shortfall(context) !== null
  },

  evaluate(context: DailyContext): readonly Recommendation[] {
    const gap = shortfall(context)
    if (gap === null) return []

    return [
      {
        key: 'sleep-short@1',
        type: 'insight',
        domain: 'sleep',
        priority: gap.missingMinutes >= SERIOUS_GAP_MINUTES ? 'high' : 'medium',
        title: 'Anoche dormiste poco',
        message: 'Si hoy entrenas, plantéate bajar el volumen o acortar la sesión.',
        reason: gap.target
          ? `Dormiste ${formatMinutes(gap.minutes)}, ${formatMinutes(gap.missingMinutes)} menos de tu objetivo.`
          : `Dormiste ${formatMinutes(gap.minutes)}, por debajo de las 6 h.`,
        data: { minutes: gap.minutes },
      },
    ]
  },
}

interface Shortfall {
  readonly minutes: number
  /** Cuánto faltó para el listón que aplique. */
  readonly missingMinutes: number
  /** Si el listón es del usuario o el de por defecto. */
  readonly target: boolean
}

/**
 * Cuánto se quedó corta la noche, o `null` si no se quedó corta.
 *
 * Reúne los dos caminos —objetivo propio y referencia general— en un sitio, para
 * que `appliesTo` y `evaluate` no puedan discrepar sobre cuándo hay algo que
 * decir.
 */
function shortfall(context: DailyContext): Shortfall | null {
  const minutes = context.sleep.lastNightMinutes
  if (minutes === undefined) return null

  const target = context.goals.sleepMinutes

  if (target === undefined) {
    if (minutes >= SHORT_SLEEP_MINUTES) return null
    return { minutes, missingMinutes: SHORT_SLEEP_MINUTES - minutes, target: false }
  }

  const missingMinutes = target - minutes
  if (missingMinutes <= TOLERANCE_MINUTES) return null

  return { minutes, missingMinutes, target: true }
}
