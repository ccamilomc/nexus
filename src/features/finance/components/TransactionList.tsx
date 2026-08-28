import { Pencil, Repeat } from 'lucide-react'

import { EmptyState } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'
import { cn } from '@/shared/lib/utils'
import { formatCop } from '@/shared/utils'

import { useRemoveTransaction } from '../hooks/use-finance'
import type { FinanceTransactionWithNames } from '../types/finance.types'
import { transactionParts } from '../utils/finance-totals'

interface TransactionListProps {
  readonly transactions: readonly FinanceTransactionWithNames[]
  readonly onEdit: (transaction: FinanceTransactionWithNames) => void
  /** Cuál se está corrigiendo, para señalarlo en la lista. */
  readonly editingId: string | null
}

const dayFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })

/** Fecha corta de un `YYYY-MM-DD`, a mediodía para que no la desplace la zona. */
function formatDay(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return dateKey

  return dayFormatter.format(new Date(year, month - 1, day, 12))
}

/** Los últimos movimientos, del más reciente al más antiguo. */
export function TransactionList({ transactions, onEdit, editingId }: TransactionListProps) {
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
            <li
              key={transaction.id}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5',
                // El que se está corrigiendo se señala: el formulario está
                // arriba y sin esto no se sabe cuál de todos se va a cambiar.
                transaction.id === editingId && 'bg-accent',
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                  {transaction.kind === 'transfer'
                    ? 'Traspaso'
                    : // Un gasto repartido enseña sus categorías, no sólo la
                      // principal: si dijera «Mercado» a secas, el reparto que
                      // se acaba de hacer no se vería por ninguna parte.
                      transactionParts(transaction)
                        .map((part) => part.name)
                        .join(' + ')}

                  {/* Los que salieron de un pago fijo se marcan: en una lista
                      larga hay que poder distinguir lo que ya estaba decidido
                      de lo que se decidió ese día. */}
                  {transaction.recurring_id !== null ? (
                    <Repeat className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Fijo" />
                  ) : null}
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

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground"
                onClick={() => onEdit(transaction)}
              >
                <Pencil aria-hidden />
                <span className="sr-only">Corregir {formatCop(transaction.amount)}</span>
              </Button>

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
