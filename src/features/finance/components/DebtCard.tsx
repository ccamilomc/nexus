import { Pencil } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'
import { Progress } from '@/shared/components/ui/progress'
import { cn } from '@/shared/lib/utils'
import { formatCop } from '@/shared/utils'

import { INTEREST_KIND_LABELS } from '../constants/finance.constants'
import type { DebtWithBalance } from '../types/finance.types'

interface DebtCardProps {
  readonly item: DebtWithBalance
  readonly isBusy: boolean
  /** Se está corrigiendo ahora mismo, y se marca para no perderla de vista. */
  readonly isEditing: boolean
  readonly onEdit: () => void
  readonly onToggleSettled: (debtId: string, isSettled: boolean) => void
  readonly onRemove: (debtId: string) => void
}

/** La tasa, con coma decimal: en español «1,5 %», no «1.5 %». */
const rateFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })

const dayFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function formatDay(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return dateKey

  return dayFormatter.format(new Date(year, month - 1, day, 12))
}

/**
 * Una deuda: cuánto falta, cuánto se ha abonado y qué intereses corren.
 *
 * **Los intereses se enseñan aparte del capital**, no sumados en una sola
 * cifra. Ver «debes 1.220.000» sin saber que 220.000 son intereses esconde
 * justo lo que hay que mirar antes de firmar el siguiente préstamo.
 */
export function DebtCard({
  item,
  isBusy,
  isEditing,
  onEdit,
  onToggleSettled,
  onRemove,
}: DebtCardProps) {
  const { debt, balance } = item
  const isSettled = debt.settled_at !== null
  const total = balance.principal + balance.interest
  const progress = total === 0 ? 0 : (balance.paid / total) * 100
  const iOwe = debt.direction === 'i_owe'

  return (
    <Card className={cn(isSettled && 'opacity-60', isEditing && 'ring-2 ring-ring')}>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{debt.counterpart}</p>
            <p className="text-xs text-muted-foreground">
              {iOwe ? 'Le debes' : 'Te debe'} · desde {formatDay(debt.started_on)}
              {debt.due_on ? ` · hasta ${formatDay(debt.due_on)}` : ''}
              {debt.instalments ? ` · ${debt.instalments} cuotas` : ''}
            </p>
          </div>

          <div className="flex shrink-0 gap-1">
            {/* El nombre lleva el de la contraparte: en una lista, varios
                botones «Corregir» no le dicen nada a un lector de pantalla. */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Corregir la deuda de ${debt.counterpart}`}
              disabled={isBusy}
              className="text-muted-foreground"
              onClick={onEdit}
            >
              <Pencil aria-hidden />
            </Button>

            <ConfirmButton
              label={isSettled ? 'Reabrir' : 'Saldada'}
              confirmLabel={isSettled ? 'Sí, reabrir' : 'Sí, saldada'}
              disabled={isBusy}
              onConfirm={() => onToggleSettled(debt.id, !isSettled)}
              className="text-muted-foreground"
            />

            {/* Saldada y borrada no son lo mismo: la primera es «ya la pagué» y
                se queda en el histórico; la segunda, «no existía». */}
            <ConfirmButton
              label="Quitar"
              confirmLabel="Sí, quitar"
              disabled={isBusy}
              onConfirm={() => onRemove(debt.id)}
              className="text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {isSettled ? 'Saldada' : 'Falta'}
          </span>
          <span className="text-xl font-semibold tabular-nums">{formatCop(balance.remaining)}</span>
        </div>

        <Progress value={progress} label={`Abonado de ${debt.counterpart}`} />

        <dl className="grid grid-cols-3 gap-2 text-xs">
          <Figure label="Prestado" value={formatCop(balance.principal)} />
          <Figure label="Abonado" value={formatCop(balance.paid)} />
          <Figure
            label="Intereses"
            value={balance.interest === 0 ? '—' : formatCop(balance.interest)}
          />
        </dl>

        {debt.interest_kind !== 'none' && debt.interest_rate !== null ? (
          // Se dice **cómo** corre, no sólo cuánto: el mismo 2 % da casi el
          // doble de intereses sobre el capital que sobre el saldo.
          <p className="text-xs text-muted-foreground">
            {rateFormatter.format(debt.interest_rate)} % mensual{' '}
            {INTEREST_KIND_LABELS[debt.interest_kind]}
          </p>
        ) : null}

        {debt.note ? <p className="text-xs text-muted-foreground">{debt.note}</p> : null}
      </CardContent>
    </Card>
  )
}

function Figure({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}
