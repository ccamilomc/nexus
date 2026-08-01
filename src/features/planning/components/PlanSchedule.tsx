import { Trash2, Undo2 } from 'lucide-react'

import { formatTime } from '@/shared/utils'

import type { PlanItem } from '../types/planning.types'

interface PlanScheduleProps {
  readonly items: readonly PlanItem[]
  readonly onToggle: (item: PlanItem) => void
  readonly onRemove: (itemId: string) => void
  readonly isBusy: boolean
}

/**
 * Lo que el usuario se ha propuesto hoy, en orden.
 *
 * Va **encima** de las recomendaciones porque son cosas distintas: esto lo
 * decidió él; aquéllas se las propone el motor. Mezclarlas haría que las
 * sugerencias parecieran obligaciones.
 */
export function PlanSchedule({ items, onToggle, onRemove, isBusy }: PlanScheduleProps) {
  if (items.length === 0) return null

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const isDone = item.status === 'done'

        return (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
          >
            <button
              type="button"
              onClick={() => onToggle(item)}
              disabled={isBusy}
              aria-label={
                isDone
                  ? `Devolver «${item.title}» a pendiente`
                  : `Marcar «${item.title}» como hecho`
              }
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
            >
              {isDone ? <Undo2 className="h-3.5 w-3.5" aria-hidden /> : null}
            </button>

            <span className="w-12 shrink-0 text-xs tabular-nums text-muted-foreground">
              {/* Sin hora no se inventa ninguna: hay cosas de «hoy» sin «a las». */}
              {item.scheduled_start === null ? '—' : formatTime(item.scheduled_start)}
            </span>

            <span
              className={
                isDone
                  ? 'min-w-0 flex-1 text-sm text-muted-foreground line-through'
                  : 'min-w-0 flex-1 text-sm'
              }
            >
              {item.title}
            </span>

            <button
              type="button"
              onClick={() => onRemove(item.id)}
              disabled={isBusy}
              aria-label={`Quitar «${item.title}» del plan`}
              className="-m-1 shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
