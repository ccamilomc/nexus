import { Card, CardContent } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'
import { formatCop } from '@/shared/utils'

import type { CategorySpend, FinanceTotals } from '../types/finance.types'
import { CategoryBreakdown } from './CategoryBreakdown'

interface MonthTotalsProps {
  readonly totals: FinanceTotals
  readonly byCategory: readonly CategorySpend[]
}

/**
 * El mes: lo que entró, lo que salió y en qué se fue.
 *
 * **El balance negativo se enseña en rojo, y es la excepción deliberada** a la
 * regla de que Nexus no juzga (docs/11: las comparativas van en gris, Salud no
 * opina). Aquí el usuario pidió lo contrario: saber la verdad aunque las cosas
 * vayan mal. Gastar más de lo que entra no es un matiz de interpretación, es un
 * hecho con consecuencias, y pintarlo del mismo gris que todo lo demás sería
 * esconderlo.
 */
export function MonthTotals({ totals, byCategory }: MonthTotalsProps) {
  const isNegative = totals.balance < 0
  const variableExpense = totals.expense - totals.fixedExpense

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Figure label="Gastado" value={formatCop(totals.expense)} />
            <Figure label="Ingresado" value={formatCop(totals.income)} />
            <Figure label="Balance" value={formatCop(totals.balance)} isNegative={isNegative} />
          </div>

          {/* Separar lo que se repite de lo que se decide cada día es lo que
              deja ver sobre cuánto se manda de verdad. Sólo se dice cuando hay
              fijos: si no, sería una línea que siempre dice cero. */}
          {totals.fixedExpense > 0 ? (
            <p className="text-xs text-muted-foreground">
              De lo gastado, <span className="tabular-nums">{formatCop(totals.fixedExpense)}</span>{' '}
              son fijos y <span className="tabular-nums">{formatCop(variableExpense)}</span> los
              decidiste sobre la marcha.
            </p>
          ) : null}
        </div>

        <CategoryBreakdown byCategory={byCategory} />
      </CardContent>
    </Card>
  )
}

interface FigureProps {
  readonly label: string
  readonly value: string
  /** Sólo el balance puede ir en rojo, y sólo cuando de verdad está en rojo. */
  readonly isNegative?: boolean
}

function Figure({ label, value, isNegative = false }: FigureProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-0.5 text-xl font-semibold tabular-nums',
          isNegative && 'text-destructive',
        )}
      >
        {value}
      </p>
    </div>
  )
}
