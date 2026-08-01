import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

import { Card, CardContent } from '@/shared/components/ui/card'

import type { Comparison } from '../types/analytics.types'

interface KpiCardProps {
  readonly label: string
  /** La cifra ya formateada por su dominio. */
  readonly value: string
  /** Cómo cambió respecto al tramo anterior; `null` si no hay con qué comparar. */
  readonly comparison: Comparison | null
  /** Aclaración breve: el denominador, o por qué no se compara. */
  readonly hint: string | null
}

const DIRECTION_ICONS = { up: ArrowUp, down: ArrowDown, flat: Minus }
const DIRECTION_LABELS = { up: 'más', down: 'menos', flat: 'igual' }

/**
 * Una cifra del periodo, con su comparación.
 *
 * La comparación va en gris y sin colores de estado, a propósito. Una flecha
 * roja sobre «dormiste menos» convierte un dato en un reproche, y el sistema
 * acompaña sin regañar: la dirección se ve, el juicio lo pone el usuario. Es la
 * misma decisión que ya se tomó con el peso en Salud.
 */
export function KpiCard({ label, value, comparison, hint }: KpiCardProps) {
  const Icon = comparison ? DIRECTION_ICONS[comparison.direction] : null

  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </h3>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>

        {comparison && Icon ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {comparison.direction === 'flat'
              ? 'Igual que el periodo anterior'
              : `${comparison.percent} % ${DIRECTION_LABELS[comparison.direction]} que el periodo anterior`}
          </p>
        ) : hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
