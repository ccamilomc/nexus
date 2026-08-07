import { Card, CardContent } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { cn } from '@/shared/lib/utils'
import { formatCop } from '@/shared/utils'

import type { BudgetStatus } from '../types/finance.types'

interface BudgetListProps {
  readonly budgets: readonly BudgetStatus[]
  /** Qué día del mes es hoy y cuántos tiene, para saber si vas a tiempo. */
  readonly monthProgress: number
}

/**
 * Cómo van los topes del mes.
 *
 * **Compara contra el mes, no sólo contra el tope.** «Llevas el 80 %» no dice
 * nada por sí solo: es tranquilizador el día 28 y una alarma el día 10. Por eso
 * se dice cuánto llevas del mes al lado, que es lo que convierte el dato en
 * decisión.
 */
export function BudgetList({ budgets, monthProgress }: BudgetListProps) {
  if (budgets.length === 0) return null

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Topes del mes
          </h3>
          <span className="text-xs text-muted-foreground">
            Va el {Math.round(monthProgress)} % del mes
          </span>
        </div>

        {budgets.map((budget) => (
          <BudgetRow key={budget.categoryId} budget={budget} monthProgress={monthProgress} />
        ))}
      </CardContent>
    </Card>
  )
}

interface BudgetRowProps {
  readonly budget: BudgetStatus
  readonly monthProgress: number
}

function BudgetRow({ budget, monthProgress }: BudgetRowProps) {
  // Ir por delante del mes no es pasarse todavía, pero es lo que hay que ver a
  // tiempo: gastado el 80 % el día 10 acaba mal aunque el tope siga entero.
  const isAhead = !budget.isExceeded && budget.percent > monthProgress + 10

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-sm">{budget.name}</span>
        <span className="shrink-0 text-sm tabular-nums">
          <span className="font-medium">{formatCop(budget.spent)}</span>
          <span className="text-muted-foreground"> de {formatCop(budget.cap)}</span>
        </span>
      </div>

      <Progress
        value={budget.percent}
        label={`${budget.name}: ${formatCop(budget.spent)} de ${formatCop(budget.cap)}`}
        isExceeded={budget.isExceeded}
      />

      {/* El aviso va en palabras además de en color: quien no distingue el
          ámbar tiene que enterarse igual. */}
      <p className={cn('text-xs', budget.isExceeded ? 'text-warning' : 'text-muted-foreground')}>
        {budget.isExceeded
          ? `Te pasaste ${formatCop(Math.abs(budget.remaining))}.`
          : isAhead
            ? `Te quedan ${formatCop(budget.remaining)}, y vas por delante del mes.`
            : `Te quedan ${formatCop(budget.remaining)}.`}
      </p>
    </div>
  )
}
