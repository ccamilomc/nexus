import { useRef, useState } from 'react'

import { EmptyState, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { formatCop } from '@/shared/utils'

import { DebtCard } from '../components/DebtCard'
import { DebtForm } from '../components/DebtForm'
import { FinanceNav } from '../components/FinanceNav'
import { TransactionForm } from '../components/TransactionForm'
import {
  useAccounts,
  useCategories,
  useDebts,
  useRemoveDebt,
  useSettleDebt,
} from '../hooks/use-finance'

/** Lo que debes y lo que te deben. */
export function DebtsPage() {
  const debts = useDebts()
  const settle = useSettleDebt()
  const remove = useRemoveDebt()
  const accounts = useAccounts()
  const categories = useCategories()
  const [editingId, setEditingId] = useState<string | null>(null)
  /** La deuda que se está abonando, si se pulsó «Abonar» en su tarjeta. */
  const [payingId, setPayingId] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const payRef = useRef<HTMLDivElement>(null)

  const vivas = (debts.data ?? []).filter(({ debt }) => debt.settled_at === null)
  const saldadas = (debts.data ?? []).filter(({ debt }) => debt.settled_at !== null)

  // Se busca en lo cargado: si la deuda se borra mientras se corrige, la edición
  // se cae sola en vez de quedar apuntando a algo que ya no está.
  const editing = (debts.data ?? []).find(({ debt }) => debt.id === editingId)?.debt ?? null

  const paying = vivas.find(({ debt }) => debt.id === payingId) ?? null

  const startPaying = (debtId: string) => {
    setEditingId(null)
    setPayingId(debtId)
    // El formulario aparece debajo de la lista: sin bajar, pulsar «Abonar»
    // parecería no hacer nada, que es justo el problema que esto viene a
    // resolver.
    setTimeout(() => payRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
  }

  const startEditing = (debtId: string) => {
    setPayingId(null)
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
                isPaying={payingId === item.debt.id}
                onEdit={() => startEditing(item.debt.id)}
                onPay={() => startPaying(item.debt.id)}
                onToggleSettled={(debtId, isSettled) => settle.mutate({ debtId, isSettled })}
                onRemove={(debtId) => remove.mutate(debtId)}
              />
            ))}

            {/*
              Abonar desde la deuda, que es donde se piensa en ella.

              Antes el abono sólo existía en Movimientos, detrás de un campo que
              aparecía sólo si tenías deudas de ese sentido: cinco pasos, y nada
              en esta pantalla lo insinuaba. **Es el mismo formulario de
              siempre** —un abono es un movimiento como cualquier otro— pero con
              el sentido y la deuda ya resueltos.
            */}
            {paying ? (
              <div ref={payRef} className="scroll-mt-4">
                <Card>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-medium">
                        {paying.debt.direction === 'owed_to_me'
                          ? `Te abona ${paying.debt.counterpart}`
                          : `Le abonas a ${paying.debt.counterpart}`}
                      </h2>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPayingId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Faltan {formatCop(paying.balance.remaining)}. Lo que apuntes aquí baja la
                      deuda y mueve el saldo de la cuenta, como cualquier otro movimiento.
                    </p>
                    <TransactionForm
                      accounts={accounts.data ?? []}
                      categories={categories.data ?? []}
                      debts={debts.data ?? []}
                      payingDebt={paying}
                    />
                  </CardContent>
                </Card>
              </div>
            ) : null}

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
