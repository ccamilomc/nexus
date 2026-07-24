import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { workoutRoutinePath } from '@/app/router/routes'
import { Card } from '@/shared/components/ui/card'

import type { Routine } from '../types/workout.types'

interface RoutineListProps {
  readonly routines: readonly Routine[]
}

/** Lista de rutinas; cada una enlaza a su detalle. */
export function RoutineList({ routines }: RoutineListProps) {
  return (
    <ul className="space-y-3">
      {routines.map((routine) => (
        <li key={routine.id}>
          <Card>
            <Link
              to={workoutRoutinePath(routine.id)}
              className="flex items-center justify-between gap-3 rounded-xl p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{routine.name}</p>
                {routine.goal ? (
                  <p className="truncate text-sm text-muted-foreground">{routine.goal}</p>
                ) : null}
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </Card>
        </li>
      ))}
    </ul>
  )
}
