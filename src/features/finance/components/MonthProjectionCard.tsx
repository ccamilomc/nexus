import { Card, CardContent } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'
import { formatCop } from '@/shared/utils'

import type { MonthProjection } from '../types/finance.types'

interface MonthProjectionCardProps {
  /** `null` fuera del mes en curso o mientras cargan los datos. */
  readonly projection: MonthProjection | null
}

/** Cuánto queda de mes, dicho como lo diría una persona. */
function describeDaysLeft(daysLeft: number): string {
  if (daysLeft === 0) return 'Último día del mes'
  if (daysLeft === 1) return 'Queda 1 día'

  return `Quedan ${daysLeft} días`
}

/** Lo que los fijos todavía tienen que mover. `null` si no queda ninguno. */
function describePending(projection: MonthProjection): string | null {
  const { pendingExpense, pendingIncome, pendingCount } = projection

  if (pendingCount === 0) return null

  const label = pendingCount === 1 ? 'pago fijo' : 'pagos fijos'

  if (pendingIncome === 0) {
    return `Faltan por salir ${formatCop(pendingExpense)} de ${pendingCount} ${label}.`
  }

  if (pendingExpense === 0) {
    return `Faltan por entrar ${formatCop(pendingIncome)} de ${pendingCount} ${label}.`
  }

  return `De tus ${label} faltan ${formatCop(pendingExpense)} por salir y ${formatCop(pendingIncome)} por entrar.`
}

/**
 * Cómo va a terminar el mes.
 *
 * **Separa lo que se sabe de lo que se supone.** Los fijos que faltan por vencer
 * son un hecho: están apuntados con su fecha. El gasto de lo que queda es una
 * suposición —que los días que vienen se parecerán a los que van—, y por eso se
 * dice con «unos» y redondeado, nunca al peso.
 *
 * **El cierre en rojo se dice en palabras además de en color**, igual que el
 * aviso de los topes: quien no distingue el rojo tiene que enterarse igual.
 */
export function MonthProjectionCard({ projection }: MonthProjectionCardProps) {
  if (!projection) return null

  const { daysLeft, committedBalance, estimatedVariable, projectedBalance } = projection

  // Cuando el ritmo sale en cero no hay estimación que añadir: el cierre es lo
  // que ya está apuntado, y llamarlo «estimado» sobraría.
  const hasRate = estimatedVariable !== null && estimatedVariable > 0
  const closing = hasRate && projectedBalance !== null ? projectedBalance : committedBalance
  const isNegative = closing < 0

  const pendingLine = describePending(projection)

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Cómo termina el mes
          </h3>
          <span className="shrink-0 text-xs text-muted-foreground">
            {describeDaysLeft(daysLeft)}
          </span>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {hasRate ? 'Cierre estimado' : 'Con lo que ya está apuntado'}
          </p>
          <p
            className={cn(
              'mt-0.5 text-xl font-semibold tabular-nums',
              isNegative && 'text-destructive',
            )}
          >
            {formatCop(closing)}
          </p>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          {pendingLine ? <p>{pendingLine}</p> : null}

          {hasRate ? (
            <p>
              Al ritmo de estos días se irían unos {formatCop(estimatedVariable)} más antes de
              acabar.
            </p>
          ) : null}

          {/* Sólo cuando de verdad se calló por falta de días: el último día del
              mes no estima nada porque no queda nada por delante, y eso ya lo
              dice «Último día del mes». */}
          {estimatedVariable === null && daysLeft > 0 ? (
            <p>Todavía son pocos días para calcular tu ritmo de gasto.</p>
          ) : null}

          {isNegative ? (
            <p className="text-destructive">
              Cerrarías el mes gastando {formatCop(Math.abs(closing))} más de lo que entró.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
