/**
 * Mínimo de lecturas para que la línea cuente algo.
 *
 * Con dos o tres puntos una línea no añade nada a la lista de debajo: sólo
 * uniría los números que ya se leen.
 */
export const MIN_SPARKLINE_POINTS = 4

/** Un punto del trazado, en coordenadas del `viewBox`. */
export interface SparklinePoint {
  readonly x: number
  readonly y: number
}

/**
 * El trazado de una medida a lo largo del tiempo, para dibujarlo sin librerías.
 *
 * Devuelve puntos en un `viewBox` de `width` × `height`, del más antiguo al más
 * reciente. La escala vertical se ajusta al recorrido de los propios valores y
 * **no arranca en cero**: entre 89 y 92 kg, un eje desde cero dejaría la línea
 * plana y escondería justo lo que se quiere ver.
 *
 * Por eso no lleva ejes ni etiquetas: sin cero, la altura no se puede leer como
 * una cantidad. La forma dice cómo ha ido; los números están en la lista.
 *
 * Cuando todos los valores son iguales la línea va por el medio: dividir por un
 * recorrido de cero daría `NaN`, y una recta plana es justo lo que ha pasado.
 */
export function buildSparkline(
  values: readonly number[],
  width: number,
  height: number,
): readonly SparklinePoint[] {
  if (values.length < 2) return []

  let min = values[0] ?? 0
  let max = min

  for (const value of values) {
    if (value < min) min = value
    if (value > max) max = value
  }

  const range = max - min
  const stepX = width / (values.length - 1)

  return values.map((value, index) => ({
    x: round(index * stepX),
    // El SVG cuenta la `y` hacia abajo, así que el valor más alto va arriba.
    y: round(range === 0 ? height / 2 : height - ((value - min) / range) * height),
  }))
}

/** Los puntos en el formato que entiende `<polyline>`. */
export function toPolylinePoints(points: readonly SparklinePoint[]): string {
  return points.map(({ x, y }) => `${x},${y}`).join(' ')
}

/** Dos decimales bastan para un trazado de este tamaño. */
function round(value: number): number {
  return Math.round(value * 100) / 100
}
