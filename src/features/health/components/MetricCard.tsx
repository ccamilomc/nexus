import { Trash2 } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'

import { METRIC_LABELS } from '../constants/health.constants'
import { useRemoveMetric } from '../hooks/use-health'
import type { MetricSummary } from '../types/health.types'
import { formatChange, formatMeasuredAt, formatValue } from '../utils/format'

interface MetricCardProps {
  readonly summary: MetricSummary
}

/**
 * Una medida: su última lectura y lo que ha cambiado.
 *
 * El cambio se muestra **en gris, sin flechas ni colores**: subir o bajar de
 * peso no es bueno ni malo sin saber qué persigue quien lo mide. Pintar de rojo
 * un `+0,4 kg` sería la aplicación opinando sobre el cuerpo de alguien.
 */
export function MetricCard({ summary }: MetricCardProps) {
  const { type, latest, change, previous } = summary
  const removeMetric = useRemoveMetric()

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {METRIC_LABELS[type]}
          </p>
          <p className="text-2xl font-semibold tabular-nums">
            {formatValue(latest.value, latest.unit)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatMeasuredAt(latest.measured_at)}
            {change === null || previous === null
              ? null
              : ` · ${formatChange(change, latest.unit)} desde el ${formatMeasuredAt(previous.measured_at)}`}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="iconSm"
          className="text-muted-foreground hover:text-destructive"
          disabled={removeMetric.isPending}
          aria-label={`Quitar la última medición de ${METRIC_LABELS[type].toLowerCase()}`}
          onClick={() => removeMetric.mutate(latest.id)}
        >
          <Trash2 aria-hidden />
        </Button>
      </CardContent>
    </Card>
  )
}
