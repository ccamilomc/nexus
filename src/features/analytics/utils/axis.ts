import type { SeriesPoint } from '@/shared/utils'

/** Configuración del eje vertical de una gráfica. */
export interface VerticalAxis {
  readonly domain: readonly [number, number]
  readonly ticks: readonly number[]
}

const MINUTES_PER_HOUR = 60

/** Marcas que caben en el eje sin amontonarse. */
const MAX_TICKS = 5

/**
 * Eje ajustado a los datos, con las marcas cuadradas a múltiplos de `unit`.
 *
 * Recharts arranca en cero por defecto, y eso aplasta cualquier magnitud que no
 * viva cerca del cero: entre seis y ocho horas de sueño no se distingue nada en
 * una escala de cero a diez, y setenta y cinco kilos en una de cero a ochenta,
 * tampoco. Cuadrar las marcas evita además etiquetas como «3 h» donde en
 * realidad hay 2 h 30.
 *
 * Se usa sólo en gráficas de **línea**. En las de barra la longitud codifica la
 * magnitud, así que ahí el cero no se toca: recortarlo exageraría diferencias.
 */
export function fittedAxis(points: readonly SeriesPoint[], unit: number): VerticalAxis | null {
  const values = points.reduce<number[]>((collected, { value }) => {
    if (value !== null) collected.push(value)

    return collected
  }, [])

  if (values.length === 0) return null

  const lowest = Math.floor(Math.min(...values) / unit)
  // Al menos una unidad de margen arriba: si el máximo cae justo en una marca,
  // el pico quedaría pegado al borde superior.
  const highest = Math.floor(Math.max(...values) / unit) + 1

  const from = Math.max(0, lowest)
  const span = Math.max(1, highest - from)
  const step = Math.max(1, Math.ceil(span / MAX_TICKS))

  const ticks: number[] = []
  for (let mark = from; mark <= from + span; mark += step) {
    ticks.push(mark * unit)
  }

  return { domain: [from * unit, (from + span) * unit], ticks }
}

/** Eje en horas enteras para una serie de minutos (el sueño). */
export function hourAxis(points: readonly SeriesPoint[]): VerticalAxis | null {
  return fittedAxis(points, MINUTES_PER_HOUR)
}
