import { Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { Skeleton } from '@/shared/components/feedback'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'

import { useActiveGoal, useWeekSpend } from '../hooks/use-nutrition'
import { formatCop } from '../utils/format'
import { calculateProgress } from '../utils/goal-progress'

interface BudgetCardProps {
  readonly date: Date
}

/** Lo gastado en comida esta semana, y cuánto queda del presupuesto. */
export function BudgetCard({ date }: BudgetCardProps) {
  const { data: spend, isPending } = useWeekSpend(date)
  const { data: goal } = useActiveGoal()

  const budget = goal?.weekly_food_budget ?? null

  // Sin presupuesto y sin ningún gasto no hay nada que contar: la tarjeta
  // desaparece en lugar de ocupar sitio con ceros.
  if (!isPending && budget === null && (spend?.itemsWithPrice ?? 0) === 0) return null

  const progress = budget !== null ? calculateProgress(spend?.totalCop ?? 0, budget) : null

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Wallet className="h-4 w-4" aria-hidden />
            Gasto de la semana
          </h2>
          {isPending ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="text-lg font-semibold tabular-nums">
              {formatCop(spend?.totalCop ?? 0)}
              {budget !== null ? (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  / {formatCop(budget)}
                </span>
              ) : null}
            </p>
          )}
        </div>

        {progress ? (
          <div className="space-y-1">
            <Progress
              value={progress.percent}
              label={`Presupuesto: ${progress.percent}% gastado`}
              isExceeded={progress.isExceeded}
            />
            <p className="text-xs text-muted-foreground">
              {progress.isExceeded
                ? `Te pasaste por ${formatCop(progress.consumed - progress.target)}.`
                : `Te quedan ${formatCop(progress.remaining)}.`}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            <Link to={ROUTES.nutritionGoals} className="underline hover:text-foreground">
              Fija un presupuesto semanal
            </Link>{' '}
            para ver cuánto te queda.
          </p>
        )}

        {spend && spend.itemsWithoutPrice > 0 ? (
          <p className="text-xs text-warning">
            {spend.itemsWithoutPrice}{' '}
            {spend.itemsWithoutPrice === 1 ? 'alimento no tiene' : 'alimentos no tienen'} precio,
            así que el gasto real es mayor.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
