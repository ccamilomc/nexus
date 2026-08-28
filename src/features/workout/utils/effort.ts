/**
 * Cuánto costó una serie.
 *
 * **Se pregunta en repeticiones en reserva y se guarda en RPE.** Son la misma
 * escala del revés (`RPE = 10 − RIR`), pero sólo una de las dos se puede
 * contestar de verdad frente a la barra: nadie sabe si acaba de hacer «un 8»,
 * y todo el mundo sabe si le quedaban dos.
 *
 * Se guarda RPE porque es lo que entiende cualquiera que mire la base y lo que
 * usa la literatura de fuerza; la columna existe desde el primer día
 * (`rpe numeric(3,1) check (rpe between 0 and 10)`) y hasta ahora nadie la
 * llenaba.
 */

/** Lo que se ofrece en pantalla: de «al fallo» a «me quedaban cuatro o más». */
export const RIR_OPTIONS = [0, 1, 2, 3, 4] as const

export type Rir = (typeof RIR_OPTIONS)[number]

/** El tope de la escala: llegar al fallo es RPE 10. */
const RPE_AL_FALLO = 10

/** El RPE que se guarda para unas repeticiones en reserva dadas. */
export function rpeFromRir(rir: Rir): number {
  return RPE_AL_FALLO - rir
}

/**
 * Las repeticiones que quedaban, a partir del RPE guardado.
 *
 * No se recorta a las cinco opciones de la pantalla: si algún día entra un RPE
 * de otra parte, es mejor enseñar lo que dice que fingir que es uno de los
 * nuestros.
 */
export function rirFromRpe(rpe: number | null): number | null {
  return rpe === null ? null : RPE_AL_FALLO - rpe
}

/**
 * Cómo se lee una serie ya apuntada.
 *
 * Devuelve `null` cuando no se anotó el esfuerzo, que es el caso normal: la
 * pregunta es opcional y la serie vale igual sin contestarla.
 */
export function formatEffort(rpe: number | null): string | null {
  const rir = rirFromRpe(rpe)
  if (rir === null) return null

  if (rir <= 0) return 'al fallo'

  // Una reserva con decimales no la escribe esta pantalla, pero la columna la
  // admite; se enseña con coma, que es como se escriben aquí los decimales.
  const cifra = Number.isInteger(rir) ? String(rir) : rir.toFixed(1).replace('.', ',')

  return rir === 1 ? 'quedaba 1' : `quedaban ${cifra}`
}
