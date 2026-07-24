import { cn } from '@/shared/lib/utils'

import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS } from '../constants/workout.constants'
import type { Exercise } from '../types/workout.types'

interface ExerciseListProps {
  readonly exercises: readonly Exercise[]
  /** Si se indica, cada ejercicio se vuelve seleccionable. */
  readonly onSelect?: (exercise: Exercise) => void
}

function ExerciseSummary({ exercise }: { readonly exercise: Exercise }) {
  return (
    <>
      <p className="truncate font-medium">{exercise.name}</p>
      <p className="text-xs text-muted-foreground">
        {EQUIPMENT_LABELS[exercise.equipment]}
        {exercise.is_custom ? ' · Personal' : ''}
      </p>
    </>
  )
}

/** Lista de ejercicios agrupada por grupo muscular. */
export function ExerciseList({ exercises, onSelect }: ExerciseListProps) {
  const groups = new Map<Exercise['muscle_group'], Exercise[]>()
  for (const exercise of exercises) {
    const current = groups.get(exercise.muscle_group) ?? []
    current.push(exercise)
    groups.set(exercise.muscle_group, current)
  }

  const itemClassName = 'rounded-lg border border-border bg-card p-3 text-left'

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([group, items]) => (
        <section key={group} aria-labelledby={`muscle-${group}`}>
          <h2 id={`muscle-${group}`} className="mb-2 text-sm font-medium text-muted-foreground">
            {MUSCLE_GROUP_LABELS[group]}
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((exercise) => (
              <li key={exercise.id} className="min-w-0">
                {onSelect ? (
                  <button
                    type="button"
                    onClick={() => onSelect(exercise)}
                    className={cn(
                      itemClassName,
                      'w-full transition-colors hover:border-primary/50 hover:bg-accent',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                  >
                    <ExerciseSummary exercise={exercise} />
                  </button>
                ) : (
                  <div className={itemClassName}>
                    <ExerciseSummary exercise={exercise} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
