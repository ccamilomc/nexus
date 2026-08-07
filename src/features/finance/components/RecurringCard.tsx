import { Check } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'
import { cn } from '@/shared/lib/utils'
import { formatCop } from '@/shared/utils'

import { RECURRENCE_LABELS } from '../constants/finance.constants'
import type { RecurringWithStatus } from '../types/finance.types'

interface RecurringCardProps {
  readonly item: RecurringWithStatus
  readonly isBusy: boolean
  readonly onConfirm: () => void
  readonly onTogglePaused: (recurringId: string, isPaused: boolean) => void
  readonly onRemove: (recurringId: string) => void
}

const dayFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })

function formatDay(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return dateKey

  return dayFormatter.format(new Date(year, month - 1, day, 12))
}

/**
 * Cuándo toca el siguiente, dicho como lo diría una persona.
 *
 * «Faltan 23 días» obliga a contar; «vence el 30 de ago» se entiende de un
 * vistazo. Lo cercano se dice en días porque ahí sí importa la cuenta.
 */
function describeDue(daysLeft: number, dateKey: string): string {
  if (daysLeft < -1) return `Venció hace ${Math.abs(daysLeft)} días`
  if (daysLeft === -1) return 'Venció ayer'
  if (daysLeft === 0) return 'Vence hoy'
  if (daysLeft === 1) return 'Vence mañana'
  if (daysLeft <= 7) return `Vence en ${daysLeft} días`

  return `Vence el ${formatDay(dateKey)}`
}

/** Un pago fijo: cuánto, cada cuánto y cuándo toca el siguiente. */
export function RecurringCard({
  item,
  isBusy,
  onConfirm,
  onTogglePaused,
  onRemove,
}: RecurringCardProps) {
  const { recurring, daysLeft, isDue } = item
  const isPaused = recurring.paused_at !== null

  return (
    <Card className={cn(isPaused && 'opacity-60')}>
      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{recurring.name}</p>
          <p className="text-xs text-muted-foreground">
            {RECURRENCE_LABELS[recurring.frequency]} ·{' '}
            {isPaused ? 'en pausa' : describeDue(daysLeft, recurring.next_due_on)}
          </p>
        </div>

        <span
          className={cn(
            'shrink-0 font-semibold tabular-nums',
            recurring.kind === 'income' && 'text-success',
          )}
        >
          {recurring.kind === 'income' ? '+' : '−'}
          {formatCop(recurring.amount)}
        </span>

        <div className="flex shrink-0 flex-wrap gap-1">
          {/* Confirmar sólo aparece cuando de verdad toca: ofrecerlo siempre
              invitaría a apuntar un pago que aún no ha ocurrido. */}
          {isDue ? (
            <Button type="button" size="sm" disabled={isBusy} onClick={onConfirm}>
              <Check aria-hidden />
              Ya lo pagué
            </Button>
          ) : null}

          <ConfirmButton
            label={isPaused ? 'Reanudar' : 'Pausar'}
            confirmLabel={isPaused ? 'Sí, reanudar' : 'Sí, pausar'}
            disabled={isBusy}
            onConfirm={() => onTogglePaused(recurring.id, !isPaused)}
            className="text-muted-foreground"
          />

          <ConfirmButton
            label="Quitar"
            confirmLabel="Sí, quitar"
            disabled={isBusy}
            onConfirm={() => onRemove(recurring.id)}
            className="text-muted-foreground"
          />
        </div>
      </CardContent>
    </Card>
  )
}
