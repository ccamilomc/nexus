/**
 * Utilidades de tiempo del motor. Puras y sin dependencias.
 *
 * El motor **nunca lee el reloj**: todo sale de `context.now` y `context.date`,
 * que se le inyectan para que dos evaluaciones con los mismos datos den siempre
 * el mismo resultado (ver docs/06-decision-engine-e-ia.md).
 */

const MS_PER_DAY = 86_400_000

/** Hora local (0-23) de un instante ISO. */
export function hourOf(iso: string): number {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? 0 : date.getHours()
}

/**
 * Días completos entre dos fechas `YYYY-MM-DD`.
 *
 * Se comparan a mediodía para que el horario de verano no reste ni sume un día
 * de más.
 */
export function daysBetween(fromDateKey: string, toDateKey: string): number {
  const from = noonOf(fromDateKey)
  const to = noonOf(toDateKey)
  if (from === null || to === null) return 0

  return Math.round((to - from) / MS_PER_DAY)
}

function noonOf(dateKey: string): number | null {
  const [year, month, day] = dateKey.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return null

  const date = new Date(year, month - 1, day, 12)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

/**
 * Una fecha `YYYY-MM-DD` en lenguaje humano: «viernes, 24 de julio».
 *
 * Se parte a mano y se sitúa a mediodía: `new Date('2026-07-24')` se
 * interpretaría en UTC y en Colombia mostraría el día anterior.
 */
export function formatDateKey(dateKey: string): string {
  const noon = noonOf(dateKey)
  if (noon === null) return dateKey

  return new Date(noon).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/**
 * Días de la semana ya vividos, contando el actual: lunes = 1, domingo = 7.
 *
 * La semana empieza el lunes, como en el resto de Nexus.
 */
export function weekdayPosition(dateKey: string): number {
  const noon = noonOf(dateKey)
  if (noon === null) return 1

  // getDay(): 0 = domingo. Se convierte a «días transcurridos desde el lunes».
  return ((new Date(noon).getDay() + 6) % 7) + 1
}
