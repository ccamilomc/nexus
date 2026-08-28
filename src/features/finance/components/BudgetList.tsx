import { Card, CardContent } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { cn } from '@/shared/lib/utils'
import { formatCop } from '@/shared/utils'

import { useRemoveMonthBudget, useSetMonthBudget } from '../hooks/use-finance'
import type { BudgetsOverview, BudgetStatus, SpendAgainstCap } from '../types/finance.types'
import { capMessage } from '../utils/budgets'
import { CapField } from './CapField'

interface BudgetListProps {
  readonly overview: BudgetsOverview
  /** Qué día del mes es hoy y cuántos tiene, para saber si vas a tiempo. */
  readonly monthProgress: number
}

/**
 * Cuánto te propusiste gastar y cómo vas: primero el mes entero, luego cada
 * categoría.
 *
 * **Compara contra el mes, no sólo contra el límite.** «Llevas el 80 %» no dice
 * nada por sí solo: es tranquilizador el día 28 y una alarma el día 10. Por eso
 * se dice cuánto llevas del mes al lado, que es lo que convierte el dato en
 * decisión.
 *
 * **El presupuesto del mes va arriba y no al final** porque es el marco: los
 * topes por categoría son el detalle de dentro. Y no se mide sumando los topes,
 * porque la mayor parte del gasto no tiene ninguno.
 */
export function BudgetList({ overview, monthProgress }: BudgetListProps) {
  // Fuera del mes en curso no hay nada que medir, y decirlo sería ruido: un
  // tope es un valor único, no un histórico.
  if (!overview.isCurrentMonth) return null

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Presupuesto del mes
          </h3>
          <span className="text-xs text-muted-foreground">
            Va el {Math.round(monthProgress)} % del mes
          </span>
        </div>

        <MonthBudget status={overview.month} monthProgress={monthProgress} />

        {overview.categories.length > 0 ? (
          <div className="space-y-4 border-t border-border pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Topes por categoría
            </h3>

            {overview.categories.map((budget) => (
              <BudgetRow key={budget.categoryId} budget={budget} monthProgress={monthProgress} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

interface MonthBudgetProps {
  readonly status: SpendAgainstCap | null
  readonly monthProgress: number
}

/**
 * El presupuesto del mes, con su propio botón para ponerlo o cambiarlo.
 *
 * **Se pone aquí y no en Categorías**, donde viven los topes: el presupuesto no
 * es de ninguna categoría. Se edita donde se lee.
 *
 * Sin presupuesto queda una sola línea discreta en vez de una tarjeta vacía: hay
 * que poder ponerlo sin buscarlo, pero a quien no lo quiera no le estorba.
 */
function MonthBudget({ status, monthProgress }: MonthBudgetProps) {
  const save = useSetMonthBudget()
  const remove = useRemoveMonthBudget()

  const field = (
    <CapField
      label="Presupuesto del mes"
      current={status?.cap ?? null}
      setLabel="Poner presupuesto"
      isBusy={save.isPending || remove.isPending}
      failure={(save.error ?? remove.error)?.message ?? null}
      onSave={(amount) => save.mutateAsync(amount)}
      onRemove={status ? () => remove.mutateAsync() : null}
    />
  )

  if (status === null) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Este mes no tiene presupuesto.</p>
        {field}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-lg tabular-nums">
          <span className="font-semibold">{formatCop(status.spent)}</span>
          <span className="text-muted-foreground"> de {formatCop(status.cap)}</span>
        </span>
        {field}
      </div>

      <Progress
        value={status.percent}
        label={`Presupuesto del mes: ${formatCop(status.spent)} de ${formatCop(status.cap)}`}
        tone={status.isExceeded ? 'warning' : 'default'}
      />

      {/* El aviso va en palabras además de en color: quien no distingue el
          ámbar tiene que enterarse igual. */}
      <p className={cn('text-xs', status.isExceeded ? 'text-warning' : 'text-muted-foreground')}>
        {capMessage(status, monthProgress)}
      </p>
    </div>
  )
}

interface BudgetRowProps {
  readonly budget: BudgetStatus
  readonly monthProgress: number
}

function BudgetRow({ budget, monthProgress }: BudgetRowProps) {
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
        tone={budget.isExceeded ? 'warning' : 'default'}
      />

      <p className={cn('text-xs', budget.isExceeded ? 'text-warning' : 'text-muted-foreground')}>
        {capMessage(budget, monthProgress)}
      </p>
    </div>
  )
}
