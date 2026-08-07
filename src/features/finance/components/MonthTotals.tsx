import { Card, CardContent } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { cn } from '@/shared/lib/utils'
import { formatCop } from '@/shared/utils'

import type { CategorySpend, FinanceTotals } from '../types/finance.types'

interface MonthTotalsProps {
  readonly totals: FinanceTotals
  readonly byCategory: readonly CategorySpend[]
}

/** Cuántas categorías se enseñan antes de que la lista deje de leerse. */
const TOP_CATEGORIES = 5

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
  const visible = byCategory.slice(0, TOP_CATEGORIES)
  const rest = byCategory.slice(TOP_CATEGORIES)
  const restAmount = rest.reduce((sum, category) => sum + category.amount, 0)

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

        {byCategory.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              En qué se fue
            </h3>

            {visible.map((category) => (
              <div key={category.categoryId ?? 'sin-categoria'} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-sm">{category.name}</span>
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {formatCop(category.amount)}
                  </span>
                </div>
                <Progress
                  value={category.share}
                  label={`${category.name}: ${formatCop(category.amount)}`}
                />
              </div>
            ))}

            {/* Lo que no cabe se resume, no se calla: un reparto que suma menos
                del total invita a confiar en una cifra incompleta. */}
            {rest.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Y {rest.length} {rest.length === 1 ? 'categoría más' : 'categorías más'} por{' '}
                {formatCop(restAmount)}.
              </p>
            ) : null}
          </div>
        ) : null}
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
