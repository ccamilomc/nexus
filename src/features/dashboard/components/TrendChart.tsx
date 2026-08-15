import { useId } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { EmptyState } from '@/shared/components/feedback'
import type { SeriesPoint } from '@/shared/utils'

import { MIN_DAYS_FOR_TREND } from '../constants/dashboard.constants'
import type { VerticalAxis } from '../utils/axis'
import { formatChartDate, formatCount } from '../utils/format'

interface TrendChartProps {
  /** Qué representa la serie; lo anuncian los lectores de pantalla. */
  readonly label: string
  readonly points: readonly SeriesPoint[]
  /**
   * Cuánto se ha registrado de verdad, con el nombre que le da su dominio
   * («2 noches», «5 días entrenados»). De aquí sale la decisión de dibujar o no.
   */
  readonly recorded: {
    readonly count: number
    readonly singular: string
    readonly plural: string
  }
  /**
   * Qué forma le toca a la serie, y no es una preferencia estética:
   *
   * - `bar` para lo que **ocurre por episodios y se acumula**, donde un día sin
   *   nada es un cero de verdad: el volumen de un entrenamiento, los minutos
   *   estudiados, el gasto del día.
   * - `line` para **magnitudes continuas que se miden** y donde el hueco es
   *   ausencia de medida, no un cero: el peso, las horas de sueño.
   * - `area` para **proporciones**, que no se acumulan ni se miden: el
   *   porcentaje de hábitos cumplidos. Con barras, noventa días de una ratio
   *   que salta entre 0, 33, 66 y 100 se leen como un código de barras; el
   *   relleno bajo la línea deja ver el nivel, que es lo que se pregunta.
   */
  readonly variant: 'line' | 'bar' | 'area'
  /** Cifra completa, para el tooltip y la tabla equivalente. */
  readonly formatValue: (value: number) => string
  /** Versión corta para el eje; por defecto, la misma. */
  readonly formatAxisValue?: (value: number) => string
  /**
   * Escala vertical a medida. Sin esto el eje arranca en cero, que es lo
   * correcto para las barras pero aplasta una línea (ver `hourAxis`).
   */
  readonly verticalAxis?: VerticalAxis
  /**
   * Color de la serie: un índice de `--chart-N`, o `neutral` para el gris
   * apagado del tema. Salud usa `neutral` a propósito, porque no opina.
   */
  readonly colorIndex?: 1 | 2 | 3 | 4 | 5 | 'neutral'
  /**
   * El objetivo, dibujado como una línea de referencia.
   *
   * **Es lo que convierte «cuánto» en «¿voy bien?»**, que es la pregunta que
   * de verdad se hace quien mira. Sin ella, una serie de sueño sólo dice que
   * unas noches se durmió más que otras; con ella se ve de un vistazo cuántas
   * quedaron por debajo de lo que uno se propuso.
   *
   * Sólo se pasa cuando el usuario **ha fijado un objetivo**: inventar uno por
   * defecto sería medir a nadie contra una cifra que no eligió.
   */
  readonly reference?: {
    readonly value: number
    /** Cómo se llama esa línea, ya formateada: «Tu objetivo: 8 h». */
    readonly label: string
  }
}

/** Cuántas marcas caben en el eje sin amontonarse en un móvil de 320 px. */
const MAX_AXIS_TICKS = 5

/**
 * Una serie diaria dibujada —o el motivo por el que todavía no se dibuja.
 *
 * **Se niega a dibujar con menos de `MIN_DAYS_FOR_TREND` registros.** La regla
 * vive aquí y no en cada sección porque es parte de dibujar una serie con
 * honestidad: con dos puntos siempre sale una recta, y una recta parece una
 * tendencia. Teniéndola dentro, un dominio nuevo no puede olvidarla.
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
  recorded,
  variant,
  formatValue,
  formatAxisValue,
  verticalAxis,
  colorIndex = 1,
  reference,
}: TrendChartProps) {
  // Antes de cualquier salida: es un hook. Un id por instancia, porque dos
  // áreas en la misma página compartirían el degradado y la segunda se pintaría
  // con el color de la primera.
  const fillId = `trend-fill-${useId()}`

  if (recorded.count < MIN_DAYS_FOR_TREND) {
    return (
      <EmptyState
        title="Aún no hay tendencia que dibujar"
        description={`Con ${formatCount(recorded.count, recorded.singular, recorded.plural)} no se ve una tendencia. Desde ${MIN_DAYS_FOR_TREND} empieza a notarse.`}
      />
    )
  }

  const color =
    colorIndex === 'neutral' ? 'hsl(var(--muted-foreground))' : `hsl(var(--chart-${colorIndex}))`
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
      {/* Discontinua y en gris de texto: la referencia acompaña, no compite con
          el dato. Sólida y en color parecería otra serie. */}
      {reference ? (
        <ReferenceLine
          y={reference.value}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="4 4"
          strokeWidth={1}
          label={{
            value: reference.label,
            position: 'insideTopRight',
            fill: 'hsl(var(--muted-foreground))',
            fontSize: 11,
          }}
        />
      ) : null}
    </>
  )

  return (
    <figure className="m-0">
      {/* `min-w-0` para que la caja pueda encoger dentro de un grid o flex, y
          `overflow-hidden` para que un SVG aún sin remedir no empuje la página. */}
      <div className="h-56 w-full min-w-0 overflow-hidden" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          {variant === 'area' ? (
            <AreaChart data={[...points]} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              {axes}
              <defs>
                {/* El relleno se desvanece hacia abajo para que la línea siga
                    siendo el dato y el área sólo acompañe. */}
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${fillId})`}
                // Sin puntos: con noventa días son noventa manchas sobre la
                // línea. El valor exacto lo da el tooltip y la tabla de abajo.
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </AreaChart>
          ) : variant === 'line' ? (
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
