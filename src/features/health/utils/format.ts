const decimalFormatter = new Intl.NumberFormat('es', { maximumFractionDigits: 2 })

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
