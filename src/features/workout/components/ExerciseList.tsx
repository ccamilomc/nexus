import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS } from '../constants/workout.constants'
import type { Exercise } from '../repositories/workout.repository'

interface ExerciseListProps {
  readonly exercises: readonly Exercise[]
}

/** Lista de ejercicios agrupada por grupo muscular. */
export function ExerciseList({ exercises }: ExerciseListProps) {
  const groups = new Map<Exercise['muscle_group'], Exercise[]>()
  for (const exercise of exercises) {
    const current = groups.get(exercise.muscle_group) ?? []
    current.push(exercise)
    groups.set(exercise.muscle_group, current)
  }

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([group, items]) => (
        <section key={group} aria-labelledby={`muscle-${group}`}>
          <h2 id={`muscle-${group}`} className="mb-2 text-sm font-medium text-muted-foreground">
            {MUSCLE_GROUP_LABELS[group]}
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((exercise) => (
              <li
                key={exercise.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{exercise.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {EQUIPMENT_LABELS[exercise.equipment]}
                    {exercise.is_custom ? ' · Personal' : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
