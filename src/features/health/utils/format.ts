import type { WeightTrend } from '../types/health.types'

const decimalFormatter = new Intl.NumberFormat('es', { maximumFractionDigits: 2 })

/**
 * Un decimal, para lo que sale de promediar.
 *
 * Una tendencia calculada con dos pesadas contra seis no tiene dos decimales de
 * precisión: escribir «0,31 kg por semana» sería fingirla, que es justo lo que
 * este cálculo viene a evitar.
 */
const trendFormatter = new Intl.NumberFormat('es', { maximumFractionDigits: 1 })

/** Una medida con su unidad: `74,5 kg`, `82 cm`. */
export function formatValue(value: number, unit: string): string {
  return `${decimalFormatter.format(value)} ${unit}`
}

/**
 * El cambio respecto a la medición anterior: `+0,4 kg`, `−0,7 kg`.
 *
 * Lleva siempre el signo —también el `+`— porque es una diferencia, no una
 * cifra suelta. Se usa el signo menos tipográfico (−), no el guion.
 */
export function formatChange(change: number, unit: string): string {
  const sign = change > 0 ? '+' : change < 0 ? '−' : '±'

  return `${sign}${decimalFormatter.format(Math.abs(change))} ${unit}`
}

/**
 * Hacia dónde va el peso, en una frase: «Bajando 0,3 kg por semana».
 *
 * Describe, no valora: subir o bajar no es bueno ni malo sin saber qué persigue
 * quien se pesa. Por eso «bajando» y no «bien», y por eso va en gris y sin
 * flechas (ver docs/11-ux-ui-y-diseno.md).
 */
export function formatTrend(direction: WeightTrend['direction'], kgPerWeek: number): string {
  if (direction === 'stable') return 'Se mantiene estable'

  const verb = direction === 'up' ? 'Subiendo' : 'Bajando'

  return `${verb} ${trendFormatter.format(Math.abs(kgPerWeek))} kg por semana`
}

/** Una media de pesadas: `90,7 kg`. Un decimal, por lo mismo que la tendencia. */
export function formatAverage(value: number): string {
  return `${trendFormatter.format(value)} kg`
}

/** El índice, con su coma decimal: `24,6`. */
export function formatBmiValue(value: number): string {
  return decimalFormatter.format(value)
}

/** «31 de julio», para fechar una medición sin ruido. */
export function formatMeasuredAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
}
