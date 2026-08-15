import type { SeriesPoint } from '@/shared/utils'
import { parseDateKey } from '@/shared/utils'

import { formatChartDate } from '../utils/format'
import { buildHabitGrid, intensityOf } from '../utils/habit-grid'

/** Iniciales de lunes a domingo; sólo se rotulan tres para no apelmazar. */
const WEEKDAY_INITIALS = ['L', '', 'X', '', 'V', '', 'D']

/**
 * Cuánto pinta cada escalón.
 *
 * **Una sola tinta, de menos a más**, que es lo que corresponde a una magnitud:
 * usar colores distintos por escalón haría pensar en categorías —como si el
 * 40 % fuese «otra cosa» que el 80 %— en vez de en más y menos.
 *
 * El escalón 0 se pinta con el gris de fondo y no con la tinta al 0 %: un día
 * a cero es un dato, y tiene que verse que está ahí.
 */
const LEVEL_CLASSES = [
  'bg-muted',
  'bg-[hsl(var(--chart-5)/0.25)]',
  'bg-[hsl(var(--chart-5)/0.5)]',
  'bg-[hsl(var(--chart-5)/0.75)]',
  'bg-[hsl(var(--chart-5))]',
]

/** Un día sin hábitos vigentes: ni cumplido ni fallado, no había nada. */
const EMPTY_CLASS = 'bg-transparent border border-border/40'

interface HabitCalendarProps {
  readonly points: readonly SeriesPoint[]
  /** Para el resumen accesible: «en los últimos 30 días». */
  readonly description: string
}

/**
 * El calendario de constancia: una casilla por día, más oscura cuanto más se
 * cumplió.
 *
 * **Cada columna es una semana y cada fila un día**, así que en horizontal se
 * lee si hay un día que siempre se falla. Un área o unas barras no pueden
 * enseñar eso: en ellas los lunes quedan repartidos por todo el ancho.
 *
 * No usa Recharts. Son celdas de color, y una rejilla de CSS las dibuja sin
 * traerse una librería de gráficos ni un `<svg>` que luego hay que describir
 * aparte: aquí cada casilla es un elemento con su propio título.
 */
export function HabitCalendar({ points, description }: HabitCalendarProps) {
  const weeks = buildHabitGrid(points, (dateKey) => (parseDateKey(dateKey).getDay() + 6) % 7)
  if (weeks.length === 0) return null

  return (
    <figure className="m-0 space-y-2">
      <figcaption className="sr-only">{`Constancia de hábitos día a día ${description}`}</figcaption>

      <div className="flex gap-1.5">
        {/* Las iniciales van fuera de la rejilla para que las casillas no
            tengan que reservar sitio para un texto que sólo lleva una de cada
            dos filas. */}
        <div className="grid shrink-0 grid-rows-7 gap-1">
          {WEEKDAY_INITIALS.map((initial, index) => (
            <span
              key={index}
              aria-hidden
              className="flex items-center text-[10px] leading-none text-muted-foreground"
            >
              {initial}
            </span>
          ))}
        </div>

        {/* Las columnas se reparten el ancho en vez de quedarse apelotonadas a
            la izquierda, pero con un tope: estiradas del todo, cinco semanas
            darían casillas del tamaño de un botón y dejarían de leerse como un
            calendario. Con muchas semanas el tope las encoge y se desplaza. */}
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid max-w-6 flex-1 grid-rows-7 gap-1">
                {week.map((cell, dayIndex) => {
                  const level = intensityOf(cell.value)

                  return (
                    <div
                      key={cell.dateKey ?? `hueco-${dayIndex}`}
                      className={`aspect-square w-full rounded-sm ${level === null ? EMPTY_CLASS : LEVEL_CLASSES[level]}`}
                      // El título nativo da el dato al pasar el ratón sin
                      // montar un tooltip propio para una casilla de 14 px.
                      {...(cell.dateKey
                        ? {
                            title: `${formatChartDate(cell.dateKey)}: ${
                              cell.value === null
                                ? 'sin hábitos'
                                : `${Math.round(cell.value)} % cumplido`
                            }`,
                          }
                        : {})}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Legend />
    </figure>
  )
}

/**
 * Qué significa el color. Sin esto, la intensidad no dice cuánto.
 *
 * Pegada a la izquierda, bajo el calendario: al otro extremo de una tarjeta
 * ancha parecía de otra cosa.
 */
function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <span>Menos</span>
      {LEVEL_CLASSES.map((className, level) => (
        <span key={level} aria-hidden className={`h-3 w-3 rounded-sm ${className}`} />
      ))}
      <span>Más</span>
    </div>
  )
}
