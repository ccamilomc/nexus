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

/**
 * Cuánto hay que bajar de lo normal en ti para que valga decirlo.
 *
 * **En proporción y no en minutos**, porque media hora de menos no significa lo
 * mismo para quien duerme cinco que para quien duerme nueve.
 *
 * **El 12 % está elegido con números reales delante**, no a ojo. Sobre una
 * costumbre de 7 h 23 min salta a partir de 6 h 30; sobre una de 5 h 30, a
 * partir de 4 h 50. Con el 15 % que probé primero, una noche de 6 h 20 frente a
 * una costumbre de 7 h 23 —una hora larga menos— no decía nada, y eso ya no es
 * el vaivén de acostarse antes o después.
 */
const TYPICAL_SHORTFALL = 0.12

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
        reason: reason(gap),
        data: { minutes: gap.minutes },
      },
    ]
  },
}

/**
 * El porqué del aviso, diciendo contra qué se midió.
 *
 * Cuando la vara es él mismo se cuenta cuántos días la sostienen: «sueles
 * dormir 7 h 10 min» apoyado en treinta días es un dato; apoyado en siete, una
 * impresión. Quien lo lee puede pesarlo si sabe de dónde sale.
 */
function reason(gap: Shortfall): string {
  const dormido = `Dormiste ${formatMinutes(gap.minutes)}`

  if (gap.against === 'goal') {
    return `${dormido}, ${formatMinutes(gap.missingMinutes)} menos de tu objetivo.`
  }

  if (gap.against === 'typical' && gap.typical) {
    return `${dormido}. Sueles dormir ${formatMinutes(gap.typical.value)}, contando tus últimos ${gap.typical.days} días.`
  }

  return `${dormido}, por debajo de las 6 h.`
}

interface Shortfall {
  readonly minutes: number
  /** Cuánto faltó para el listón que aplique. */
  readonly missingMinutes: number
  /**
   * Contra qué se comparó.
   *
   * Viaja hasta el mensaje porque **decir el listón es parte de decir el dato**:
   * «40 min menos de tu objetivo» y «40 min menos de lo que sueles dormir» son
   * dos cosas distintas, y quien lee tiene derecho a saber cuál le están
   * diciendo.
   */
  readonly against: 'goal' | 'typical' | 'default'
  /** Lo normal en él, cuando es contra eso contra lo que se compara. */
  readonly typical?: { readonly value: number; readonly days: number }
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

  // 1 · Su objetivo. Es lo que él decidió, y manda sobre todo lo demás.
  const target = context.goals.sleepMinutes
  if (target !== undefined) {
    const missingMinutes = target - minutes
    if (missingMinutes <= TOLERANCE_MINUTES) return null

    return { minutes, missingMinutes, against: 'goal' }
  }

  // 2 · Lo que suele dormir. Sin objetivo, la mejor vara es él mismo.
  const typical = context.sleep.typicalMinutes
  if (typical !== undefined) {
    if (minutes >= typical.value * (1 - TYPICAL_SHORTFALL)) return null

    return { minutes, missingMinutes: typical.value - minutes, against: 'typical', typical }
  }

  // 3 · Las seis horas de fábrica, sólo cuando no se sabe nada de él.
  if (minutes >= SHORT_SLEEP_MINUTES) return null

  return { minutes, missingMinutes: SHORT_SLEEP_MINUTES - minutes, against: 'default' }
}
