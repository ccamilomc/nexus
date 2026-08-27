import type { Comparison } from '../types/dashboard.types'

/**
 * Variación relativa que se considera un cambio real.
 *
 * Por debajo de esto la cifra se declara estable: un 0,4 % más de sueño no es
 * una mejora, es ruido, y presentarlo como tendencia sería vender humo.
 */
const FLAT_THRESHOLD_PERCENT = 1

/**
 * A partir de aquí el porcentaje deja de informar y se dice con palabras.
 *
 * Triplicar ya es «mucho más»; de ahí para arriba nadie procesa la cifra. Y
 * sobre todo: **un porcentaje enorme casi nunca significa una mejora enorme,
 * sino que el tramo anterior estaba casi vacío.** Con tres meses de historia,
 * Analytics comparaba 90 días llenos contra los pocos días que había antes y
 * anunciaba «1267 % más», que suena a logro y sólo dice que se acaba de empezar.
 *
 * En la práctica **sólo actúa al alza**: bajar no puede pasar del 100 %, porque
 * no se pierde más de lo que había. La excepción es un periodo anterior en
 * negativo, que sólo se da en el balance de finanzas.
 */
const MAX_MEANINGFUL_PERCENT = 200

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
 * Y devuelve el cambio **sin cifra** (`percent: null`) cuando es tan grande que
 * el número estorba: mismo motivo que el cero, un paso más allá.
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

  const direction = percent > 0 ? 'up' : 'down'

  return { direction, percent: rounded > MAX_MEANINGFUL_PERCENT ? null : rounded }
}
