/**
 * Cuánto tiene que moverse una cifra para ser noticia.
 *
 * Por debajo de un 10 % es el vaivén de cualquier periodo. El umbral es más
 * alto que el 1 % con el que una tarjeta se declara «estable» a propósito: ahí
 * la pregunta es «¿cambió?» y aquí es «¿merece que lo mire antes que nada?».
 */
const MIN_PERCENT = 10

/**
 * Por encima de esto el cambio deja de ser una noticia y pasa a ser un arranque.
 *
 * Un salto de tres cifras casi siempre significa que en el tramo anterior no
 * había casi nada apuntado, no que se haya multiplicado el esfuerzo — el mismo
 * motivo por el que las tarjetas dejan de dar el porcentaje ahí (ver
 * `comparison.ts`). Como titular sería engañoso.
 */
const MAX_PERCENT = 200

/** Un cambio que podría merecer un titular, con su frase ya escrita. */
export interface HighlightCandidate {
  /** Identifica la fila; también decide el icono. */
  readonly domain: string
  /**
   * La frase, en pasado y con la cifra dentro: «Dormiste 25 min menos por
   * noche». La escribe quien conoce el dato, porque sólo su dominio sabe
   * formatearlo y cómo se llama lo que mide.
   */
  readonly text: (direction: 'up' | 'down') => string
  readonly current: number | null
  readonly previous: number | null
}

export interface Highlight {
  readonly domain: string
  readonly text: string
  readonly direction: 'up' | 'down'
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
 */
export function pickHighlights(
  candidates: readonly HighlightCandidate[],
  max: number,
): readonly Highlight[] {
  const scored: { readonly highlight: Highlight; readonly percent: number }[] = []

  for (const candidate of candidates) {
    const { current, previous } = candidate
    if (current === null || previous === null || previous === 0) continue

    const percent = Math.abs(((current - previous) / Math.abs(previous)) * 100)
    if (percent < MIN_PERCENT || percent > MAX_PERCENT) continue

    const direction = current > previous ? 'up' : 'down'
    scored.push({
      highlight: { domain: candidate.domain, text: candidate.text(direction), direction },
      percent,
    })
  }

  return scored
    .sort((a, b) => b.percent - a.percent)
    .slice(0, max)
    .map(({ highlight }) => highlight)
}
