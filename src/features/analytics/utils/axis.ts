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
 * Eje en horas para una serie de minutos.
 *
 * Recharts arranca en cero por defecto, y con el sueño eso deja la línea
 * aplastada en una franja del 20 % de la altura: entre seis y ocho horas no se
 * distingue nada dentro de una escala de cero a diez. Aquí el eje se ajusta a
 * las horas enteras que rodean a los datos, y las marcas caen justo en ellas
 * para que no salgan etiquetas como «3 h» donde en realidad hay 2 h 30.
 *
 * Se ajusta sólo en gráficas de **línea**. En las de barra la longitud codifica
 * la magnitud, así que ahí el cero no se toca.
 */
export function hourAxis(points: readonly SeriesPoint[]): VerticalAxis | null {
  const values = points.reduce<number[]>((collected, { value }) => {
    if (value !== null) collected.push(value)

    return collected
  }, [])

  if (values.length === 0) return null

  const lowestHour = Math.floor(Math.min(...values) / MINUTES_PER_HOUR)
  // Al menos una hora de margen arriba: si el máximo cae justo en una hora en
  // punto, el pico quedaría pegado al borde superior.
  const highestHour = Math.floor(Math.max(...values) / MINUTES_PER_HOUR) + 1

  const from = Math.max(0, lowestHour)
  const span = Math.max(1, highestHour - from)
  const step = Math.max(1, Math.ceil(span / MAX_TICKS))

  const ticks: number[] = []
  for (let hour = from; hour <= from + span; hour += step) {
    ticks.push(hour * MINUTES_PER_HOUR)
  }

  return { domain: [from * MINUTES_PER_HOUR, (from + span) * MINUTES_PER_HOUR], ticks }
}
