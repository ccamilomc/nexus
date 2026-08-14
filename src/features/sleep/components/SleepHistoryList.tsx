import { Trash2 } from 'lucide-react'

import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { formatMinutes } from '@/shared/utils'

import { QUALITY_LABELS } from '../constants/sleep.constants'
import { useRemoveSleepLog, useSleepGoal } from '../hooks/use-sleep'
import type { SleepHistory } from '../types/sleep.types'
import { compareWithGoal } from '../utils/against-goal'

interface SleepHistoryListProps {
  readonly history: SleepHistory
}

/** «Miércoles 29», a partir de la clave `YYYY-MM-DD`. */
function describeDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1)

  const label = date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Las últimas noches y lo que dicen en conjunto. */
export function SleepHistoryList({ history }: SleepHistoryListProps) {
  const removeLog = useRemoveSleepLog()
  // Misma consulta que la tarjeta del objetivo: TanStack la comparte, así que
  // enseñar la comparación no cuesta ningún viaje extra.
  const { data: goal } = useSleepGoal()

  if (history.logs.length === 0) return null

  const comparison = compareWithGoal(history.averageMinutes, goal?.target_minutes ?? null)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Últimas noches</h2>
        {history.averageMinutes === null ? null : (
          <p className="text-sm text-muted-foreground">
            Media:{' '}
            <strong className="text-foreground">{formatMinutes(history.averageMinutes)}</strong>
            {history.averageQuality === null
              ? null
              : ` · ${QUALITY_LABELS[history.averageQuality]}`}
          </p>
        )}
      </div>

      {/* La comparación va aquí, con la media, y no junto al objetivo: éste se
          fija una vez y vive al final de la página, a siete noches de scroll.
          Los dos números estaban en pantalla sin cruzarse nunca. */}
      {comparison === null ? null : (
        <p className="text-xs text-muted-foreground">
          {comparison.meetsGoal
            ? `Duermes lo que te propones, ${formatMinutes(comparison.targetMinutes)}.`
            : `Te faltan ${formatMinutes(comparison.missingMinutes)} para las ${formatMinutes(comparison.targetMinutes)} que quieres dormir.`}
        </p>
      )}

      {removeLog.isError ? <FormAlert>{removeLog.error.message}</FormAlert> : null}

      <ul className="space-y-2">
        {history.logs.map((log) => (
          <li
            key={log.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{describeDate(log.date)}</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {formatMinutes(log.duration_minutes)}
                {log.quality_rating === null ? null : ` · ${QUALITY_LABELS[log.quality_rating]}`}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              className="text-muted-foreground hover:text-destructive"
              disabled={removeLog.isPending}
              aria-label={`Quitar el registro del ${describeDate(log.date).toLowerCase()}`}
              onClick={() => removeLog.mutate(log.id)}
            >
              <Trash2 aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
