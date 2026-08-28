import { useState } from 'react'

import { useToday } from '@/core/time'
import { LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'
import { Card, CardContent } from '@/shared/components/ui/card'

import { AccountForm } from '../components/AccountForm'
import { BudgetList } from '../components/BudgetList'
import { FinanceNav } from '../components/FinanceNav'
import { MonthPicker } from '../components/MonthPicker'
import { MonthProjectionCard } from '../components/MonthProjectionCard'
import { MonthTotals } from '../components/MonthTotals'
import { TransactionFilters } from '../components/TransactionFilters'
import { TransactionForm } from '../components/TransactionForm'
import { TransactionList } from '../components/TransactionList'
import { TransactionsExport } from '../components/TransactionsExport'
import {
  NO_BUDGETS,
  useAccounts,
  useBudgets,
  useCategories,
  useDebts,
  useMonth,
  useMonthProjection,
} from '../hooks/use-finance'
import { monthProgressPercent } from '../utils/budgets'
import {
  filterTransactions,
  NO_FILTERS,
  type TransactionFilters as Filters,
} from '../utils/filter-transactions'

/** Tus finanzas del mes: qué entró, qué salió y en qué se fue. */
export function FinancePage() {
  const today = useToday()
  // Qué mes se mira. Arranca en el actual, que es el caso de siempre.
  const [visibleMonth, setVisibleMonth] = useState(today)
  // Cuál se está corrigiendo. El formulario de arriba hace las dos cosas.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const accounts = useAccounts()
  const categories = useCategories()
  const debts = useDebts()
  const budgets = useBudgets(visibleMonth)
  const month = useMonth(visibleMonth)
  // Por encima de las salidas tempranas: un hook detrás de un `return` dejaría
  // de llamarse en cuanto la página cargue.
  const projection = useMonthProjection(visibleMonth)

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
  const todos = month.data?.transactions ?? []
  const visibles = filterTransactions(todos, filters)

  const editing = month.data?.transactions.find(({ id }) => id === editingId) ?? null

  return (
    <>
      <PageHeader title="Finanzas" description="Lo que entra, lo que sale y en qué se va." />
      <FinanceNav />

      <div className="space-y-4">
        <MonthPicker month={visibleMonth} onChange={setVisibleMonth} today={today} />

        {month.data ? (
          <MonthTotals totals={month.data.totals} byCategory={month.data.byCategory} />
        ) : null}

        {/* Después de «cómo voy» y antes de los topes: la pregunta que sigue a
            mirar el mes es cómo va a acabar. Se calla sola fuera del mes en
            curso y cuando no tiene nada que añadir. */}
        <MonthProjectionCard projection={projection} />

        {/* Se calla sola fuera del mes en curso: un tope es un valor único, no
            un histórico, y medir julio con el tope de agosto sería mentir. */}
        <BudgetList
          overview={budgets.data ?? NO_BUDGETS}
          monthProgress={monthProgressPercent(today)}
        />

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
        {/* Juntos a propósito: el botón exporta justo lo que dejó el filtro. */}
        <div className="space-y-2">
          <TransactionFilters
            filters={filters}
            onChange={setFilters}
            categories={categories.data ?? []}
            shown={visibles.length}
            total={todos.length}
          />
          <TransactionsExport transactions={visibles} month={visibleMonth} />
        </div>

        <TransactionList
          transactions={visibles}
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
