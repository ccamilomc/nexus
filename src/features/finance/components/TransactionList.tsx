import { EmptyState } from '@/shared/components/feedback'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'
import { cn } from '@/shared/lib/utils'
import { formatCop } from '@/shared/utils'

import { useRemoveTransaction } from '../hooks/use-finance'
import type { FinanceTransactionWithNames } from '../types/finance.types'
import { UNCATEGORISED_LABEL } from '../utils/finance-totals'

interface TransactionListProps {
  readonly transactions: readonly FinanceTransactionWithNames[]
}

const dayFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })

/** Fecha corta de un `YYYY-MM-DD`, a mediodía para que no la desplace la zona. */
function formatDay(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return dateKey

  return dayFormatter.format(new Date(year, month - 1, day, 12))
}

/** Los últimos movimientos, del más reciente al más antiguo. */
export function TransactionList({ transactions }: TransactionListProps) {
  const remove = useRemoveTransaction()

  if (transactions.length === 0) {
    return (
      <EmptyState
        title="Todavía no has apuntado nada este mes"
        description="Apunta el primero arriba. Hasta el café cuenta: lo que no se registra no aparece en las cuentas."
      />
    )
  }

  return (
    <Card>
      <CardContent className="p-2">
        <ul className="divide-y divide-border">
          {transactions.map((transaction) => (
            <li key={transaction.id} className="flex items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {transaction.kind === 'transfer'
                    ? 'Traspaso'
                    : (transaction.category?.name ?? UNCATEGORISED_LABEL)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDay(transaction.occurred_on)}
                  {transaction.account ? ` · ${transaction.account.name}` : ''}
                  {/* En un traspaso importa a dónde fue, no sólo de dónde salió. */}
                  {transaction.kind === 'transfer' && transaction.toAccount
                    ? ` → ${transaction.toAccount.name}`
                    : ''}
                  {transaction.note ? ` · ${transaction.note}` : ''}
                </p>
              </div>

              {/* El signo delante y no el color solo: quien no distingue rojo de
                  verde tiene que poder leer si entró o salió. Un traspaso no
                  lleva signo, porque no entró ni salió: cambió de cajón. */}
              <span
                className={cn(
                  'shrink-0 text-sm font-semibold tabular-nums',
                  transaction.kind === 'income' && 'text-success',
                  transaction.kind === 'transfer' && 'text-muted-foreground',
                )}
              >
                {transaction.kind === 'income' ? '+' : transaction.kind === 'expense' ? '−' : ''}
                {formatCop(transaction.amount)}
              </span>

              <ConfirmButton
                label="Quitar"
                confirmLabel="Sí, quitar"
                disabled={remove.isPending}
                onConfirm={() => remove.mutate(transaction.id)}
                className="shrink-0 text-muted-foreground"
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
