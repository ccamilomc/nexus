import { useState } from 'react'

import { useToday } from '@/core/time'
import { LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'
import { Card, CardContent } from '@/shared/components/ui/card'

import { AccountForm } from '../components/AccountForm'
import { FinanceNav } from '../components/FinanceNav'
import { MonthPicker } from '../components/MonthPicker'
import { MonthTotals } from '../components/MonthTotals'
import { TransactionForm } from '../components/TransactionForm'
import { TransactionList } from '../components/TransactionList'
import { useAccounts, useCategories, useDebts, useMonth } from '../hooks/use-finance'

/** Tus finanzas del mes: qué entró, qué salió y en qué se fue. */
export function FinancePage() {
  const today = useToday()
  // Qué mes se mira. Arranca en el actual, que es el caso de siempre.
  const [visibleMonth, setVisibleMonth] = useState(today)
  // Cuál se está corrigiendo. El formulario de arriba hace las dos cosas.
  const [editingId, setEditingId] = useState<string | null>(null)
  const accounts = useAccounts()
  const categories = useCategories()
  const debts = useDebts()
  const month = useMonth(visibleMonth)

  if (accounts.isPending || month.isPending) {
    return <SkeletonList label="Cargando tus finanzas" rows={3} rowClassName="h-28" />
  }

  if (accounts.isError) {
    return <LoadFailure message={accounts.error.message} onRetry={() => void accounts.refetch()} />
  }

  if (month.isError) {
    return <LoadFailure message={month.error.message} onRetry={() => void month.refetch()} />
  }

  // Sin una cuenta no se puede apuntar nada, así que lo primero es crearla. No
  // se crea sola: inventarle al usuario una cuenta que no dijo tener haría que
  // el primer saldo ya estuviera mal.
  if (accounts.data.length === 0) {
    return (
      <>
        <PageHeader
          title="Finanzas"
          description="Empieza por decir de dónde sale: efectivo, Nequi, el banco."
        />
        <Card>
          <CardContent className="p-5">
            <AccountForm />
          </CardContent>
        </Card>
      </>
    )
  }

  // Se busca en lo que hay cargado: si el mes cambia y ya no está, la edición
  // se cae sola en vez de quedar apuntando a algo que no se ve.
  const editing = month.data?.recent.find(({ id }) => id === editingId) ?? null

  return (
    <>
      <PageHeader title="Finanzas" description="Lo que entra, lo que sale y en qué se va." />
      <FinanceNav />

      <div className="space-y-4">
        <MonthPicker month={visibleMonth} onChange={setVisibleMonth} today={today} />

        {month.data ? (
          <MonthTotals totals={month.data.totals} byCategory={month.data.byCategory} />
        ) : null}

        <Card>
          <CardContent className="p-5">
            <TransactionForm
              accounts={accounts.data}
              categories={categories.data ?? []}
              debts={debts.data ?? []}
              editing={editing}
              onFinishEditing={() => setEditingId(null)}
            />
          </CardContent>
        </Card>

        <TransactionList
          transactions={month.data?.recent ?? []}
          editingId={editingId}
          onEdit={(transaction) => {
            setEditingId(transaction.id)
            // El formulario está arriba: sin subir, al pulsar «corregir» no
            // pasaría nada visible y parecería que el botón no funciona.
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      </div>
    </>
  )
}
