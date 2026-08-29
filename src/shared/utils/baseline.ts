/** Lo normal en ti para una medida, y sobre cuántos días se calculó. */
export interface Baseline {
  /** Lo típico. Es la **mediana**, no la media. */
  readonly typical: number
  /** Cuántos días la sostienen. Pocos días no son una costumbre. */
  readonly days: number
}

/**
 * Lo normal en ti para una medida.
 *
 * Sirve para dejar de comparar contra umbrales de fábrica —«menos de seis horas
 * es poco»— y empezar a comparar contra la persona: seis horas y media es una
 * mala noche para quien duerme ocho y una buena para quien duerme seis.
 *
 * **Mediana y no media, y no es un matiz.** Una noche de tres horas arrastra una
 * media de siete a seis y media, y a partir de ahí la aplicación diría que
 * duermes menos de lo que duermes durante semanas. La mediana no se mueve por un
 * día raro, que es exactamente lo que se le pide a «lo normal».
 *
 * Devuelve `null` cuando no hay días suficientes: **es mejor no decir nada que
 * decir «lo normal en ti» apoyándose en tres días**. Quien decide cuántos hacen
 * falta es cada dominio, porque no es lo mismo dormir —todos los días— que
 * entrenar —tres veces por semana—.
 */
export function baselineOf(values: readonly number[], minDays: number): Baseline | null {
  if (values.length < minDays) return null

  const ordenados = [...values].sort((a, b) => a - b)
  const medio = Math.floor(ordenados.length / 2)

  // Con un número par de días, la mediana es el punto entre los dos centrales.
  const typical =
    ordenados.length % 2 === 0
      ? ((ordenados[medio - 1] ?? 0) + (ordenados[medio] ?? 0)) / 2
      : (ordenados[medio] ?? 0)

  return { typical: Math.round(typical), days: ordenados.length }
}

/**
 * Cuánto se aparta un valor de lo normal, en tanto por uno.
 *
 * Negativo cuando queda por debajo. En proporción y no en unidades porque media
 * hora de menos no significa lo mismo para quien duerme cinco que para quien
 * duerme nueve.
 */
export function deviationFrom(baseline: Baseline, value: number): number {
  // Una base de cero no admite proporción: cualquier cosa sería infinitas veces
  // más. Se dice que no hay desviación en vez de devolver un número imposible.
  if (baseline.typical === 0) return 0

  return (value - baseline.typical) / baseline.typical
}
