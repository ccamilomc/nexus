import { LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'
import { formatCop } from '@/shared/utils'

import { AccountForm } from '../components/AccountForm'
import { FinanceNav } from '../components/FinanceNav'
import { ACCOUNT_KIND_LABELS } from '../constants/finance.constants'
import { useAccounts, useArchiveAccount } from '../hooks/use-finance'

/** Las cuentas: de dónde sale y entra el dinero. */
export function AccountsPage() {
  const accounts = useAccounts()
  const archive = useArchiveAccount()

  return (
    <>
      <PageHeader
        title="Cuentas"
        description="Cajones con nombre, no cuentas conectadas a ningún banco."
      />
      <FinanceNav />

      <div className="space-y-4">
        {accounts.isPending ? (
          <SkeletonList label="Cargando tus cuentas" rows={2} rowClassName="h-16" />
        ) : accounts.isError ? (
          <LoadFailure message={accounts.error.message} onRetry={() => void accounts.refetch()} />
        ) : (
          <Card>
            <CardContent className="p-2">
              <ul className="divide-y divide-border">
                {accounts.data.map((account) => (
                  <li key={account.id} className="flex items-center gap-3 px-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ACCOUNT_KIND_LABELS[account.kind]} · empezó con{' '}
                        {formatCop(account.initial_balance)}
                      </p>
                    </div>

                    {/* Archivar y no borrar: los movimientos hechos desde ella
                        siguen contando la verdad, sólo deja de ofrecerse. */}
                    <ConfirmButton
                      label="Archivar"
                      confirmLabel="Sí, archivar"
                      disabled={archive.isPending}
                      onConfirm={() => archive.mutate(account.id)}
                      className="shrink-0 text-muted-foreground"
                    />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="text-sm font-medium">Añadir una cuenta</h2>
            <AccountForm />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
