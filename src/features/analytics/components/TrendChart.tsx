import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { SeriesPoint } from '@/shared/utils'

import type { VerticalAxis } from '../utils/axis'
import { formatChartDate } from '../utils/format'

interface TrendChartProps {
  /** Qué representa la serie; lo anuncian los lectores de pantalla. */
  readonly label: string
  readonly points: readonly SeriesPoint[]
  /**
   * `line` para magnitudes continuas que admiten huecos (el sueño);
   * `bar` para lo que ocurre por episodios (el volumen de un entrenamiento).
   */
  readonly variant: 'line' | 'bar'
  /** Cifra completa, para el tooltip y la tabla equivalente. */
  readonly formatValue: (value: number) => string
  /** Versión corta para el eje; por defecto, la misma. */
  readonly formatAxisValue?: (value: number) => string
  /**
   * Escala vertical a medida. Sin esto el eje arranca en cero, que es lo
   * correcto para las barras pero aplasta una línea (ver `hourAxis`).
   */
  readonly verticalAxis?: VerticalAxis
  /** Índice del color de gráfica (`--chart-N`). */
  readonly colorIndex?: 1 | 2 | 3 | 4 | 5
}

/** Cuántas marcas caben en el eje sin amontonarse en un móvil de 320 px. */
const MAX_AXIS_TICKS = 5

/**
 * Una serie diaria dibujada.
 *
 * Además del SVG rinde una **tabla equivalente** oculta a la vista: una gráfica
 * es inaccesible por definición para quien no la ve, y el `aria-label` de un
 * `<svg>` sólo puede resumirla, no darla. La tabla sí lleva los datos.
 *
 * Los huecos (`null`) se dejan sin unir a propósito: enlazar el lunes con el
 * viernes dibujaría una constancia que no existió.
 */
export function TrendChart({
  label,
  points,
  variant,
  formatValue,
  formatAxisValue,
  verticalAxis,
  colorIndex = 1,
}: TrendChartProps) {
  const color = `hsl(var(--chart-${colorIndex}))`
  const formatTick = formatAxisValue ?? formatValue
  const tickInterval = Math.max(0, Math.ceil(points.length / MAX_AXIS_TICKS) - 1)

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
      <XAxis
        dataKey="dateKey"
        tickFormatter={formatChartDate}
        interval={tickInterval}
        tickLine={false}
        axisLine={false}
        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
      />
      <YAxis
        width={46}
        tickFormatter={formatTick}
        tickLine={false}
        axisLine={false}
        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
        {...(verticalAxis
          ? {
              domain: [verticalAxis.domain[0], verticalAxis.domain[1]],
              ticks: [...verticalAxis.ticks],
            }
          : {})}
      />
      <Tooltip
        cursor={{ fill: 'hsl(var(--muted))', stroke: 'hsl(var(--muted))' }}
        content={<ChartTooltip formatValue={formatValue} />}
      />
    </>
  )

  return (
    <figure className="m-0">
      {/* `min-w-0` para que la caja pueda encoger dentro de un grid o flex, y
          `overflow-hidden` para que un SVG aún sin remedir no empuje la página. */}
      <div className="h-56 w-full min-w-0 overflow-hidden" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          {variant === 'line' ? (
            <LineChart data={[...points]} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              {axes}
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={{ r: 2.5, fill: color }}
                activeDot={{ r: 4 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          ) : (
            <BarChart data={[...points]} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              {axes}
              <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <ChartDataTable label={label} points={points} formatValue={formatValue} />
    </figure>
  )
}

interface ChartTooltipProps {
  readonly active?: boolean
  readonly label?: string | number
  readonly payload?: readonly { readonly value?: number | string }[]
  readonly formatValue: (value: number) => string
}

/**
 * Tooltip propio: el de Recharts trae fondo blanco fijo y desaparecería en
 * modo oscuro. Éste usa los tokens del tema, como el resto de la aplicación.
 */
function ChartTooltip({ active, label, payload, formatValue }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  const raw = payload[0]?.value
  const value = typeof raw === 'number' ? formatValue(raw) : 'Sin registro'

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">
        {typeof label === 'string' ? formatChartDate(label) : ''}
      </p>
      <p className="text-sm font-medium tabular-nums">{value}</p>
    </div>
  )
}

interface ChartDataTableProps {
  readonly label: string
  readonly points: readonly SeriesPoint[]
  readonly formatValue: (value: number) => string
}

/**
 * Los mismos datos en tabla, para lectores de pantalla.
 *
 * El `sr-only` va en un `div` y no en la `table`: una tabla no se encoge por
 * debajo del ancho de su contenido y no la recorta el `overflow: hidden`, así
 * que con `sr-only` encima seguía empujando la página y aparecía scroll
 * horizontal en móvil. Invisible no es lo mismo que sin ocupar sitio.
 */
function ChartDataTable({ label, points, formatValue }: ChartDataTableProps) {
  return (
    <div className="sr-only">
      <table>
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Día</th>
            <th scope="col">Valor</th>
          </tr>
        </thead>
        <tbody>
          {points.map(({ dateKey, value }) => (
            <tr key={dateKey}>
              <th scope="row">{formatChartDate(dateKey)}</th>
              <td>{value === null ? 'Sin registro' : formatValue(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
