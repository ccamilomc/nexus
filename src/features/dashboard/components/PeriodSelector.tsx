import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

import { ANALYTICS_PERIOD_LIST } from '../constants/dashboard.constants'
import type { AnalyticsPeriodId } from '../types/dashboard.types'

interface PeriodSelectorProps {
  readonly value: AnalyticsPeriodId
  readonly onChange: (period: AnalyticsPeriodId) => void
  /** Qué tramo se está mirando ahora mismo, ya escrito. */
  readonly description: string
  readonly onBack: () => void
  readonly onForward: () => void
  /** Falso cuando el tramo ya termina hoy: no se puede ir al futuro. */
  readonly canGoForward: boolean
}

/**
 * Elige el periodo que se mira. Manda sobre toda la página.
 *
 * Se implementa como `radiogroup` y no como botones sueltos porque eso es lo
 * que es: opciones excluyentes de un mismo ajuste. Un lector de pantalla lo
 * anuncia como «1 de 3» en vez de leer tres botones sin relación.
 */
export function PeriodSelector({
  value,
  onChange,
  description,
  onBack,
  onForward,
  canGoForward,
}: PeriodSelectorProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div
        role="radiogroup"
        aria-label="Periodo que se analiza"
        className="inline-flex rounded-lg border border-border bg-card p-1"
      >
        {ANALYTICS_PERIOD_LIST.map((period) => {
          const isSelected = period.id === value

          return (
            <button
              key={period.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(period.id)}
              className={cn(
                // 44 px de alto en móvil: son tres controles pegados, así que el
                // área no se puede ampliar por debajo sin robarle el toque al
                // vecino —hay que agrandarlos de verdad—. Con ratón vuelven a su
                // altura natural, como las pestañas de sección.
                'flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors sm:min-h-0 sm:py-1.5',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {period.label}
            </button>
          )
        })}
      </div>

      {/* Las mismas flechas que cambian de dia en Nutricion y Habitos: aqui
          mueven el tramo entero. Se dice entre ellas que se esta mirando,
          porque en cuanto se retrocede «los ultimos 30 dias» deja de ser cierto. */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Ver el periodo anterior"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>

        <p aria-live="polite" className="min-w-0 text-sm text-muted-foreground">
          {description}
        </p>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onForward}
          disabled={!canGoForward}
          aria-label="Ver el periodo siguiente"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
