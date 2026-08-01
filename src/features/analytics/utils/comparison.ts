import type { Comparison } from '../types/analytics.types'

/**
 * Variación relativa que se considera un cambio real.
 *
 * Por debajo de esto la cifra se declara estable: un 0,4 % más de sueño no es
 * una mejora, es ruido, y presentarlo como tendencia sería vender humo.
 */
const FLAT_THRESHOLD_PERCENT = 1

/**
 * Compara una cifra con la del periodo anterior.
 *
 * Devuelve `null` cuando la comparación no se sostiene:
 *
 * - **Sin dato en alguno de los dos periodos:** no hay nada que comparar.
 * - **Periodo anterior en cero:** el porcentaje sería infinito. Pasar de 0 a
 *   500 no es «un 100 % más», es empezar; la tarjeta lo dirá con palabras en
 *   lugar de inventar un número.
 *
 * Nota: `direction` describe **el movimiento de la cifra**, no si es una buena
 * noticia. Que suba el peso o baje el sueño lo interpreta cada tarjeta, porque
 * sólo el dominio sabe hacia dónde es mejor (o si no le corresponde opinar).
 */
export function compareValues(current: number | null, previous: number | null): Comparison | null {
  if (current === null || previous === null || previous === 0) return null

  const percent = ((current - previous) / Math.abs(previous)) * 100
  const rounded = Math.round(Math.abs(percent))

  if (Math.abs(percent) < FLAT_THRESHOLD_PERCENT) {
    return { direction: 'flat', percent: 0 }
  }

  return { direction: percent > 0 ? 'up' : 'down', percent: rounded }
}
