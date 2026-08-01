/** Formato de las cifras de Analytics. Español de Colombia, como el resto. */

const dayMonthFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })

const kilogramFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

/**
 * Fecha corta para el eje y las tablas: «27 jul».
 *
 * Se construye la fecha a mediodía para que ningún desfase horario la desplace
 * un día al interpretarla.
 */
export function formatChartDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return dateKey

  return dayMonthFormatter.format(new Date(year, month - 1, day, 12))
}

/** Volumen levantado: «12.400 kg». Sin decimales, que en kilos no aportan. */
export function formatVolumeKg(kilograms: number): string {
  return `${kilogramFormatter.format(Math.round(kilograms))} kg`
}

/** Recuento con su palabra: «3 entrenamientos», «1 entrenamiento». */
export function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}
