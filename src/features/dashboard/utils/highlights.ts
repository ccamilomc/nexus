import type { Baseline } from '@/shared/utils'

/**
 * Cuánto tiene que moverse una cifra para ser noticia, comparando con el tramo
 * anterior.
 *
 * Por debajo de un 10 % es el vaivén de cualquier periodo. El umbral es más
 * alto que el 1 % con el que una tarjeta se declara «estable» a propósito: ahí
 * la pregunta es «¿cambió?» y aquí es «¿merece que lo mire antes que nada?».
 */
const MIN_PERCENT = 10

/**
 * Cuántos vaivenes hacen raro un tramo, comparando contra lo normal en ti.
 *
 * **Dos, y está medido.** Sobre 15 semanas reales de gasto, dos vaivenes marcan
 * cuatro. Es más de lo que marcaría en una lista de avisos, pero esto es un
 * ranking de tres: cuantos más candidatos compiten, mejor sale el primero.
 *
 * Son menos que los tres del gasto suelto porque no se reparten igual: un gasto
 * suelto tiene muchos pequeños y unos pocos enormes, y la suma de una semana
 * promedia esa cola.
 */
const UNUSUAL_SPREADS = 2

/** Contra qué se comparó la cifra. Lo dice la frase, porque no es lo mismo. */
export type HighlightReference = 'previous' | 'typical'

/** Un cambio que podría merecer un titular, con su frase ya escrita. */
export interface HighlightCandidate {
  /** Identifica la fila; también decide el icono. */
  readonly domain: string
  /**
   * La frase, en pasado y con la cifra dentro: «Dormiste 25 min menos por
   * noche». La escribe quien conoce el dato, porque sólo su dominio sabe
   * formatearlo y cómo se llama lo que mide.
   *
   * Recibe la diferencia **ya en positivo y ya contra la referencia que se
   * usó**, para que la frase no pueda decir una cifra de una comparación y el
   * nombre de otra.
   */
  readonly text: (delta: number, word: 'más' | 'menos', reference: HighlightReference) => string
  readonly current: number | null
  readonly previous: number | null
  /**
   * Lo normal en el usuario para un tramo de este tamaño.
   *
   * Opcional: los dominios que todavía no lo calculan lo dejan fuera y se
   * comparan con el tramo anterior, como siempre.
   */
  readonly typical?: Baseline | null
}

export interface Highlight {
  readonly domain: string
  readonly text: string
  readonly direction: 'up' | 'down'
}

interface Scored {
  readonly highlight: Highlight
  readonly percent: number
}

/** Cuánto se movió una cifra y hacia dónde, sin la frase todavía. */
interface Movimiento {
  readonly difference: number
  readonly direction: 'up' | 'down'
  /** Lo grande que es el movimiento en proporción. Sólo sirve para ordenar. */
  readonly percent: number
}

/**
 * Dónde cae el tramo respecto a lo normal en el usuario.
 *
 * Devuelve `null` cuando no se sabe lo normal o cuando el tramo cae dentro del
 * vaivén de siempre. **Ese `null` no manda a comparar con el tramo anterior**:
 * sabiendo lo tuyo y no siendo raro, la respuesta es que no es noticia.
 */
function againstTypical(current: number, typical: Baseline): Movimiento | null | undefined {
  // Un vaivén de cero —siempre la misma cifra— haría raro cualquier movimiento,
  // y una base de cero no da porcentaje. En los dos casos no se sabe comparar.
  if (typical.spread === 0 || typical.typical === 0) return undefined

  const difference = current - typical.typical
  if (Math.abs(difference) <= typical.spread * UNUSUAL_SPREADS) return null

  return {
    difference,
    direction: difference > 0 ? 'up' : 'down',
    percent: Math.abs((difference / typical.typical) * 100),
  }
}

/**
 * Lo que más se movió en el periodo, de mayor a menor.
 *
 * El dashboard son veintiocho cifras repartidas en siete secciones: todas
 * ciertas y ninguna que diga por dónde empezar a mirar. Esto contesta esa
 * pregunta y nada más, así que **prefiere callar antes que rellenar**: sin
 * cambios que lleguen al umbral no devuelve nada y la fila no se dibuja.
 *
 * `direction` describe **el movimiento**, no si es buena noticia. Que suba el
 * gasto o baje el sueño lo interpreta quien lee; el sistema acompaña sin
 * regañar, igual que las tarjetas.
 *
 * ## Contra qué se compara
 *
 * **Contra lo normal en ti cuando se sabe; contra el tramo anterior cuando no.**
 * Es la misma escalera que usan las reglas del sueño, y por el mismo motivo: el
 * tramo anterior es **una muestra de uno**. Sobre 15 semanas reales de gasto,
 * las dos referencias discrepan en nueve: siete semanas corrientes que se
 * anunciaban como noticia sólo porque la anterior había sido rara, y una —la
 * más cara del historial— que no se anunciaba.
 *
 * Sabiendo lo normal y no siendo raro, **se calla en vez de caer al tramo
 * anterior**: caer ahí sería volver justo a la muestra de uno de la que se huye.
 *
 * ## Por qué ya no hay techo
 *
 * Se descartaban los saltos de más del 200 %, con el argumento de que casi
 * siempre significan que en el tramo anterior no había nada apuntado. Sobre
 * datos reales eso silenciaba la semana más cara del historial —1.808.300 pesos,
 * casi el triple de lo normal— porque la anterior había sido floja: un 614 %. Y
 * el tramo anterior no estaba vacío, tenía 253.100 pesos.
 *
 * El porcentaje es **como se ordena**, no lo que se dice: la frase lleva la
 * diferencia en absoluto —«Gastaste 1.555.200 más»— y esa es cierta salga el
 * porcentaje que salga. Dejarlo decidir si algo se enseña era darle un trabajo
 * que no es el suyo. Lo único que sigue fuera es comparar contra cero, que no
 * es un porcentaje.
 */
export function pickHighlights(
  candidates: readonly HighlightCandidate[],
  max: number,
): readonly Highlight[] {
  const scored: Scored[] = []

  for (const candidate of candidates) {
    const { current, previous, typical, domain } = candidate
    if (current === null) continue

    const build = (delta: number, direction: 'up' | 'down', reference: HighlightReference) => ({
      domain,
      text: candidate.text(Math.abs(delta), direction === 'up' ? 'más' : 'menos', reference),
      direction,
    })

    if (typical) {
      const contra = againstTypical(current, typical)

      // `null` es «lo sé y no es noticia»; `undefined` es «no lo sé», y ahí
      // todavía queda el tramo anterior.
      if (contra !== undefined) {
        if (contra !== null) {
          scored.push({
            highlight: build(contra.difference, contra.direction, 'typical'),
            percent: contra.percent,
          })
        }

        continue
      }
    }

    if (previous === null || previous === 0) continue

    const percent = Math.abs(((current - previous) / Math.abs(previous)) * 100)
    if (percent < MIN_PERCENT) continue

    scored.push({
      highlight: build(current - previous, current > previous ? 'up' : 'down', 'previous'),
      percent,
    })
  }

  return scored
    .sort((a, b) => b.percent - a.percent)
    .slice(0, max)
    .map(({ highlight }) => highlight)
}
