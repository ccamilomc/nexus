import { buildSparkline, MIN_SPARKLINE_POINTS, toPolylinePoints } from '../utils/sparkline'

interface MetricSparklineProps {
  /** Valores del más antiguo al más reciente, como se leen de izquierda a derecha. */
  readonly values: readonly number[]
  /** Qué se está dibujando, para quien no ve la línea. */
  readonly description: string
}

/** Coordenadas del `viewBox`; el SVG se estira al ancho que le den. */
const WIDTH = 300
const HEIGHT = 48

/**
 * La forma de una medida a lo largo del tiempo, en una línea.
 *
 * La lista de debajo da los números; esto da el recorrido, que en una columna de
 * veinte cifras hay que reconstruir leyendo. Va sin ejes ni etiquetas: la escala
 * se ajusta a los propios valores y no arranca en cero —entre 89 y 92 kg un eje
 * desde cero dejaría la línea plana—, así que la altura no se puede leer como
 * una cantidad. Dice cómo ha ido, no cuánto.
 *
 * **La línea va sin suavizar**, con todo su dentado, aunque la tarjeta de arriba
 * promedie el peso justamente para quitárselo. No es contradicción: allí se
 * resume el estado actual en una frase y el ruido lo falsea; aquí se enseña lo
 * que de verdad pasó, y alisarlo sería dibujar unos datos que no se tomaron.
 * Entre las dos se lee todo: la línea dice lo irregular que fue el camino y el
 * texto, hacia dónde lleva. Vale además para las medidas de cinta métrica, que
 * se toman una vez al mes y no tienen ruido que promediar.
 *
 * En SVG a mano y no con Recharts: la librería vive sólo en la ruta de
 * Analíticas para no cargarla en el resto de la aplicación, y una polilínea no
 * justifica traerla aquí.
 *
 * Va en el color de marca, que no significa ni bien ni mal: Salud no opina sobre
 * si el peso sube o baja (ver docs/11-ux-ui-y-diseno.md).
 */
export function MetricSparkline({ values, description }: MetricSparklineProps) {
  if (values.length < MIN_SPARKLINE_POINTS) return null

  const points = buildSparkline(values, WIDTH, HEIGHT)

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      // Se estira a lo ancho: sólo importa la forma, no la proporción.
      preserveAspectRatio="none"
      className="h-12 w-full text-primary"
      role="img"
      aria-label={description}
    >
      <polyline
        points={toPolylinePoints(points)}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        // El trazo no se estira con el viewBox, así se mantiene fino. Es también
        // la razón de que aquí no haya puntos marcados: un círculo sí se
        // deformaría en elipse al ensancharse la tarjeta.
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
