import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { workoutRoutinePath } from '@/app/router/routes'
import { Card } from '@/shared/components/ui/card'

import type { RoutineSummary } from '../types/workout.types'
import { formatSessionDate } from '../utils/format'

interface RoutineListProps {
  readonly summaries: readonly RoutineSummary[]
  /** Momento de referencia para fechar («Hoy», «Ayer»). */
  readonly now: Date
}

/** Cuánta rutina es: `3 días · 18 ejercicios`. */
function describeSize({ dayCount, exerciseCount }: RoutineSummary): string {
  const days = `${dayCount} ${dayCount === 1 ? 'día' : 'días'}`
  if (exerciseCount === 0) return `${days} · sin ejercicios todavía`

  return `${days} · ${exerciseCount} ${exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}`
}

/**
 * Lista de rutinas; cada una enlaza a su detalle.
 *
 * **Dice cuánta es y cuándo se usó.** Antes sólo mostraba el nombre, y un nombre
 * no responde a lo que uno se pregunta al mirar la lista: si esta rutina son
 * tres días o cinco, y si la sigue usando o lleva un mes sin tocarla. Al lado,
 * el historial cuenta hasta el volumen de cada sesión.
 */
export function RoutineList({ summaries, now }: RoutineListProps) {
  return (
    <ul className="space-y-3">
      {summaries.map((summary) => (
        <li key={summary.routine.id}>
          <Card>
            <Link
              to={workoutRoutinePath(summary.routine.id)}
              className="flex items-center justify-between gap-3 rounded-xl p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{summary.routine.name}</p>
                {summary.routine.goal ? (
                  <p className="truncate text-sm text-muted-foreground">{summary.routine.goal}</p>
                ) : null}
                <p className="truncate text-xs text-muted-foreground">
                  {describeSize(summary)}
                  {/* Sin usar todavía se dice, en vez de callar: una rutina recién
                      creada y una abandonada se distinguen desde la lista. */}
                  {summary.lastUsedAt
                    ? ` · Última vez: ${formatSessionDate(summary.lastUsedAt, now)}`
                    : ' · Todavía sin usar'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </Card>
        </li>
      ))}
    </ul>
  )
}
