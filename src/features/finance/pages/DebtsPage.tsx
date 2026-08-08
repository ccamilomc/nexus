import { useRef, useState } from 'react'

import { EmptyState, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'
import { Card, CardContent } from '@/shared/components/ui/card'
import { formatCop } from '@/shared/utils'

import { DebtCard } from '../components/DebtCard'
import { DebtForm } from '../components/DebtForm'
import { FinanceNav } from '../components/FinanceNav'
import { useDebts, useRemoveDebt, useSettleDebt } from '../hooks/use-finance'

/** Lo que debes y lo que te deben. */
export function DebtsPage() {
  const debts = useDebts()
  const settle = useSettleDebt()
  const remove = useRemoveDebt()
  const [editingId, setEditingId] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const vivas = (debts.data ?? []).filter(({ debt }) => debt.settled_at === null)
  const saldadas = (debts.data ?? []).filter(({ debt }) => debt.settled_at !== null)

  // Se busca en lo cargado: si la deuda se borra mientras se corrige, la edición
  // se cae sola en vez de quedar apuntando a algo que ya no está.
  const editing = (debts.data ?? []).find(({ debt }) => debt.id === editingId)?.debt ?? null

  const startEditing = (debtId: string) => {
    setEditingId(debtId)
    // El formulario está al final de la página: sin bajar, al pulsar «corregir»
    // no pasaría nada visible y parecería que el botón no funciona.
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // Sólo lo vivo entra en el resumen: sumar lo ya saldado diría que debes algo
  // que no debes.
  const debo = vivas
    .filter(({ debt }) => debt.direction === 'i_owe')
    .reduce((sum, { balance }) => sum + balance.remaining, 0)
  const meDeben = vivas
    .filter(({ debt }) => debt.direction === 'owed_to_me')
    .reduce((sum, { balance }) => sum + balance.remaining, 0)

  return (
    <>
      <PageHeader title="Deudas" description="Lo que debes, lo que te deben y cuánto falta." />
      <FinanceNav />

      <div className="space-y-4">
        {debts.isPending ? (
          <SkeletonList label="Cargando tus deudas" rows={2} rowClassName="h-40" />
        ) : debts.isError ? (
          <LoadFailure message={debts.error.message} onRetry={() => void debts.refetch()} />
        ) : (
          <>
            {vivas.length > 0 ? (
              <Card>
                <CardContent className="grid grid-cols-2 gap-4 p-5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Debes</p>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums text-destructive">
                      {formatCop(debo)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Te deben
                    </p>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums">
                      {formatCop(meDeben)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {vivas.map((item) => (
              <DebtCard
                key={item.debt.id}
                item={item}
                isBusy={settle.isPending || remove.isPending}
                isEditing={editingId === item.debt.id}
                onEdit={() => startEditing(item.debt.id)}
                onToggleSettled={(debtId, isSettled) => settle.mutate({ debtId, isSettled })}
                onRemove={(debtId) => remove.mutate(debtId)}
              />
            ))}

            {vivas.length === 0 && saldadas.length === 0 ? (
              <EmptyState
                title="No tienes deudas apuntadas"
                description="Apunta lo que debes y lo que te deben. Cada abono que registres las va bajando solo."
              />
            ) : null}

            {saldadas.length > 0 ? (
              <>
                <h2 className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Saldadas
                </h2>
                {saldadas.map((item) => (
                  <DebtCard
                    key={item.debt.id}
                    item={item}
                    isBusy={settle.isPending || remove.isPending}
                    isEditing={editingId === item.debt.id}
                    onEdit={() => startEditing(item.debt.id)}
                    onToggleSettled={(debtId, isSettled) => settle.mutate({ debtId, isSettled })}
                    onRemove={(debtId) => remove.mutate(debtId)}
                  />
                ))}
              </>
            ) : null}
          </>
        )}

        <Card ref={formRef}>
          <CardContent className="space-y-4 p-5">
            <h2 className="text-sm font-medium">
              {editing ? `Corregir la deuda de ${editing.counterpart}` : 'Apuntar una deuda'}
            </h2>
            <DebtForm editing={editing} onFinishEditing={() => setEditingId(null)} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
