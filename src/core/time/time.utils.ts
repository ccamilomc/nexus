/**
 * Cálculos de tiempo del reloj de la aplicación. Puros y fáciles de probar.
 *
 * Todo se mide en **hora local**: en Nexus el día es el que vive el usuario, no
 * el de UTC (ver docs/04-modelo-de-datos.md).
 */

/** Un segundo de margen para no despertar justo en el filo del cambio de hora. */
const TICK_MARGIN_MS = 1_000

/** Medianoche local del día al que pertenece `at`. */
export function startOfDay(at: Date): Date {
  return new Date(at.getFullYear(), at.getMonth(), at.getDate())
}

/**
 * Milisegundos hasta la próxima hora en punto **local**.
 *
 * La hora en punto es el único instante en que puede cambiar algo que se
 * muestre: el día (a medianoche) y el saludo (a las 6, las 12 y las 19). Con un
 * solo despertador se cubren ambos.
 *
 * Se calcula sobre el reloj local y no con aritmética sobre el epoch, porque
 * hay zonas horarias desplazadas media hora (India, Nepal): ahí la hora en
 * punto local no cae donde la haría caer una división.
 */
export function msUntilNextTick(now: Date): number {
  const next = new Date(now)
  next.setMinutes(0, 0, 0)
  next.setHours(next.getHours() + 1)

  return next.getTime() - now.getTime() + TICK_MARGIN_MS
}
