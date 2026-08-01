import { cn } from '@/shared/lib/utils'

import { ANALYTICS_PERIOD_LIST } from '../constants/analytics.constants'
import type { AnalyticsPeriodId } from '../types/analytics.types'

interface PeriodSelectorProps {
  readonly value: AnalyticsPeriodId
  readonly onChange: (period: AnalyticsPeriodId) => void
}

/**
 * Elige el periodo que se mira. Manda sobre toda la página.
 *
 * Se implementa como `radiogroup` y no como botones sueltos porque eso es lo
 * que es: opciones excluyentes de un mismo ajuste. Un lector de pantalla lo
 * anuncia como «1 de 3» en vez de leer tres botones sin relación.
 */
export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
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
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
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
  )
}
