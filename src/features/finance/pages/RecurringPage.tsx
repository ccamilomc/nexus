import { EmptyState, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'
import { Card, CardContent } from '@/shared/components/ui/card'
import { formatCop } from '@/shared/utils'

import { FinanceNav } from '../components/FinanceNav'
import { RecurringCard } from '../components/RecurringCard'
import { RecurringForm } from '../components/RecurringForm'
import {
  useAccounts,
  useCategories,
  useConfirmRecurring,
  usePauseRecurring,
  useRecurring,
  useRemoveRecurring,
} from '../hooks/use-finance'

/**
 * Los pagos fijos: lo que se repite cada mes sin que haya que pensarlo.
 *
 * **Nexus no los apunta solo.** Enseña los que tocan y se confirman de un
 * toque: un gimnasio se cancela, un cobro falla, un mes se paga distinto.
 * Apuntar un movimiento que el usuario no hizo sería inventarle datos.
 */
export function RecurringPage() {
  const items = useRecurring()
  const accounts = useAccounts()
  const categories = useCategories()
  const confirm = useConfirmRecurring()
  const pause = usePauseRecurring()
  const remove = useRemoveRecurring()

  const isBusy = confirm.isPending || pause.isPending || remove.isPending
  const all = items.data ?? []
  const due = all.filter(({ isDue }) => isDue)
  const upcoming = all.filter(({ isDue, recurring }) => !isDue && recurring.paused_at === null)
  const paused = all.filter(({ recurring }) => recurring.paused_at !== null)

  // Sólo lo que sale y no está pausado: mezclar ingresos diría que el mes
  // cuesta menos de lo que cuesta.
  const monthlyCost = all
    .filter(
      ({ recurring }) =>
        recurring.paused_at === null &&
        recurring.kind === 'expense' &&
        recurring.frequency === 'monthly',
    )
    .reduce((sum, { recurring }) => sum + recurring.amount, 0)

  const handlers = {
    onTogglePaused: (recurringId: string, isPaused: boolean) =>
      pause.mutate({ recurringId, isPaused }),
    onRemove: (recurringId: string) => remove.mutate(recurringId),
  }

  return (
    <>
      <PageHeader
        title="Fijos"
        description="Lo que se repite: gimnasio, arriendo, suscripciones."
      />
      <FinanceNav />

      <div className="space-y-4">
        {items.isPending ? (
          <SkeletonList label="Cargando tus pagos fijos" rows={3} rowClassName="h-20" />
        ) : items.isError ? (
          <LoadFailure message={items.error.message} onRetry={() => void items.refetch()} />
        ) : (
          <>
            {monthlyCost > 0 ? (
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Se te va cada mes en fijos
                  </p>
                  <p className="mt-0.5 text-xl font-semibold tabular-nums">
                    {formatCop(monthlyCost)}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {due.length > 0 ? (
              <>
                <h2 className="pt-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  Te toca pagar
                </h2>
                {due.map((item) => (
                  <RecurringCard
                    key={item.recurring.id}
                    item={item}
                    isBusy={isBusy}
                    onConfirm={() => confirm.mutate(item.recurring)}
                    {...handlers}
                  />
                ))}
              </>
            ) : null}

            {upcoming.map((item) => (
              <RecurringCard
                key={item.recurring.id}
                item={item}
                isBusy={isBusy}
                onConfirm={() => confirm.mutate(item.recurring)}
                {...handlers}
              />
            ))}

            {all.length === 0 ? (
              <EmptyState
                title="No tienes pagos fijos apuntados"
                description="El gimnasio, el arriendo, las suscripciones. Nexus te avisa cuando toquen y los apuntas de un toque."
              />
            ) : null}

            {paused.length > 0 ? (
              <>
                <h2 className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  En pausa
                </h2>
                {paused.map((item) => (
                  <RecurringCard
                    key={item.recurring.id}
                    item={item}
                    isBusy={isBusy}
                    onConfirm={() => confirm.mutate(item.recurring)}
                    {...handlers}
                  />
                ))}
              </>
            ) : null}
          </>
        )}

        {accounts.data && accounts.data.length > 0 ? (
          <Card>
            <CardContent className="space-y-4 p-5">
              <h2 className="text-sm font-medium">Apuntar un pago fijo</h2>
              <RecurringForm accounts={accounts.data} categories={categories.data ?? []} />
            </CardContent>
          </Card>
        ) : null}

        {confirm.error ? (
          <p role="alert" className="text-sm text-destructive">
            {confirm.error.message}
          </p>
        ) : null}
      </div>
    </>
  )
}
