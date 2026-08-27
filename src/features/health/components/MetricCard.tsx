import { ChevronDown, Trash2 } from 'lucide-react'
import { type ReactNode, useId, useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'

import { METRIC_LABELS } from '../constants/health.constants'
import { useRemoveMetric } from '../hooks/use-health'
import type { MetricSummary } from '../types/health.types'
import { formatChange, formatMeasuredAt, formatValue } from '../utils/format'
import { MetricHistoryList } from './MetricHistoryList'

interface MetricCardProps {
  readonly summary: MetricSummary
  /**
   * Sustituye a la línea de cambio cuando hay algo mejor que decir que la resta
   * entre las dos últimas lecturas. Lo usa el peso con su tendencia.
   */
  readonly note?: ReactNode
}

/**
 * Una medida: su última lectura, lo que ha cambiado y, si se abre, cómo ha ido.
 *
 * El cambio se muestra **en gris, sin flechas ni colores**: subir o bajar de
 * peso no es bueno ni malo sin saber qué persigue quien lo mide. Pintar de rojo
 * un `+0,4 kg` sería la aplicación opinando sobre el cuerpo de alguien.
 *
 * **El historial se despliega, no se abre en otra pantalla.** Con ocho medidas,
 * mirar dos seguidas serían cuatro navegaciones; aquí son dos toques y se
 * comparan sin perder de vista las demás. Sólo se pide al abrir.
 */
export function MetricCard({ summary, note }: MetricCardProps) {
  const { type, latest, change, previous } = summary
  const removeMetric = useRemoveMetric()
  const [isOpen, setIsOpen] = useState(false)
  const historyId = useId()
  const label = METRIC_LABELS[type]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatValue(latest.value, latest.unit)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatMeasuredAt(latest.measured_at)}
              {note || change === null || previous === null
                ? null
                : ` · ${formatChange(change, latest.unit)} desde el ${formatMeasuredAt(previous.measured_at)}`}
            </p>
            {note ? <div className="mt-1.5">{note}</div> : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              className="text-muted-foreground hover:text-foreground"
              aria-expanded={isOpen}
              aria-controls={historyId}
              aria-label={`${isOpen ? 'Ocultar' : 'Ver'} cómo ha ido ${label.toLowerCase()}`}
              onClick={() => setIsOpen((open) => !open)}
            >
              <ChevronDown
                aria-hidden
                className={cn(
                  'transition-transform duration-fast ease-out',
                  isOpen && 'rotate-180',
                )}
              />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              className="text-muted-foreground hover:text-destructive"
              disabled={removeMetric.isPending}
              aria-label={`Quitar la última medición de ${label.toLowerCase()}`}
              onClick={() => removeMetric.mutate(latest.id)}
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        </div>

        {/* Sin montar hasta abrir: es lo que evita las ocho consultas. */}
        {isOpen ? (
          <div id={historyId} className="mt-3 border-t border-border pt-3">
            <MetricHistoryList type={type} label={label} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
