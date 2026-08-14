import { LoadFailure, Skeleton } from '@/shared/components/feedback'

import { useMetricHistory } from '../hooks/use-health'
import type { BodyMetricType } from '../types/health.types'
import { formatChange, formatMeasuredAt, formatValue } from '../utils/format'
import { MetricSparkline } from './MetricSparkline'

interface MetricHistoryListProps {
  readonly type: BodyMetricType
  readonly label: string
}

/**
 * Cómo ha ido una medida, desplegado bajo su tarjeta.
 *
 * **Medir sin poder mirar atrás no sirve de nada.** La tarjeta dice la última
 * lectura y lo que cambió desde la anterior, que responde «¿cómo estoy?»; esto
 * responde la otra pregunta, «¿voy a algún sitio?», y por eso el resumen de
 * arriba compara los extremos del tramo y no las dos últimas.
 *
 * Sin flechas ni colores, igual que el resto de Salud: subir o bajar no es bueno
 * ni malo sin saber qué persigue quien lo mide.
 */
export function MetricHistoryList({ type, label }: MetricHistoryListProps) {
  const { data, isPending, isError, error, refetch } = useMetricHistory(type)

  if (isPending) {
    return (
      <div role="status" aria-label={`Cargando el historial de ${label.toLowerCase()}`}>
        <Skeleton className="h-24" />
      </div>
    )
  }

  if (isError) {
    return (
      <LoadFailure
        message={error.message ?? 'Vuelve a intentarlo en un momento.'}
        onRetry={() => void refetch()}
      />
    )
  }

  const readings = data?.readings ?? []
  const oldest = readings[readings.length - 1]

  // Una sola lectura ya está a la vista en la tarjeta: repetirla aquí sería
  // desplegar algo para no contar nada nuevo.
  if (!data || readings.length < 2 || !oldest) {
    return (
      <p className="text-sm text-muted-foreground">
        Con una sola medición todavía no hay recorrido. Apunta otra y aquí verás cómo va.
      </p>
    )
  }

  // De la más antigua a la más reciente: la línea se lee de izquierda a derecha
  // y las lecturas llegan al revés, que es como se leen en lista.
  const values = readings.map(({ value }) => value).reverse()

  return (
    <div className="space-y-2">
      {data.totalChange === null ? null : (
        <p className="text-sm text-muted-foreground">
          {formatChange(data.totalChange, data.unit)} desde el {formatMeasuredAt(oldest.measuredAt)}
          , en {readings.length} mediciones.
        </p>
      )}

      <MetricSparkline
        values={values}
        description={`Recorrido de ${label.toLowerCase()} en las últimas ${readings.length} mediciones, desde el ${formatMeasuredAt(oldest.measuredAt)}. Los valores están en la lista de debajo.`}
      />

      <ul className="divide-y divide-border">
        {readings.map((reading) => (
          <li key={reading.id} className="flex items-baseline justify-between gap-3 py-1.5">
            <span className="text-sm text-muted-foreground">
              {formatMeasuredAt(reading.measuredAt)}
            </span>
            <span className="flex items-baseline gap-2">
              <span className="text-sm font-medium tabular-nums">
                {formatValue(reading.value, reading.unit)}
              </span>
              <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">
                {reading.change === null ? '' : formatChange(reading.change, reading.unit)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
