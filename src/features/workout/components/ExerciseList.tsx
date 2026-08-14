import { ChevronRight, Pencil } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'
import { cn } from '@/shared/lib/utils'

import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS } from '../constants/workout.constants'
import type { Exercise } from '../types/workout.types'
import { ExerciseProgressPanel } from './ExerciseProgressPanel'

interface ExerciseListProps {
  readonly exercises: readonly Exercise[]
  /** Si se indica, cada ejercicio se vuelve seleccionable (modo selector). */
  readonly onSelect?: (exercise: Exercise) => void
  /** Editar/borrar; sólo se ofrecen en los ejercicios propios. */
  readonly onEdit?: (exercise: Exercise) => void
  readonly onDelete?: (exercise: Exercise) => void
  /**
   * Ejercicios con series registradas.
   *
   * Sólo en ésos se ofrece «Tus marcas»: en los demás el desplegable abría para
   * decir que no había nada, y con setenta ejercicios eran cincuenta y ocho.
   */
  readonly trainedIds?: readonly string[]
}

function ExerciseSummary({ exercise }: { readonly exercise: Exercise }) {
  return (
    <>
      <p className="truncate font-medium">{exercise.name}</p>
      <p className="text-xs text-muted-foreground">
        {EQUIPMENT_LABELS[exercise.equipment]}
        {exercise.is_custom ? ' · Personal' : ''}
      </p>
      {exercise.secondary_muscles.length > 0 ? (
        <p className="truncate text-xs text-muted-foreground">
          También:{' '}
          {exercise.secondary_muscles.map((muscle) => MUSCLE_GROUP_LABELS[muscle]).join(' · ')}
        </p>
      ) : null}
    </>
  )
}

/** Lista de ejercicios agrupada por grupo muscular. */
export function ExerciseList({
  exercises,
  onSelect,
  onEdit,
  onDelete,
  trainedIds,
}: ExerciseListProps) {
  const groups = new Map<Exercise['muscle_group'], Exercise[]>()
  for (const exercise of exercises) {
    const current = groups.get(exercise.muscle_group) ?? []
    current.push(exercise)
    groups.set(exercise.muscle_group, current)
  }

  const itemClassName = 'rounded-lg border border-border bg-card p-3 text-left'
  const hasActions = Boolean(onEdit || onDelete)

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

                    {/* Sólo fuera del selector y sólo si se ha entrenado: durante
                        el entrenamiento la referencia útil es «la última vez», y
                        en un ejercicio sin series no hay marcas que enseñar. */}
                    {trainedIds?.includes(exercise.id) ? (
                      <details className="group mt-2">
                        <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <ChevronRight
                            aria-hidden
                            className="h-3.5 w-3.5 transition-transform duration-fast ease-out group-open:rotate-90"
                          />
                          Tus marcas
                        </summary>
                        <div className="mt-2">
                          <ExerciseProgressPanel exerciseId={exercise.id} name={exercise.name} />
                        </div>
                      </details>
                    ) : null}

                    {hasActions && exercise.is_custom ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {onEdit ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={`Editar ${exercise.name}`}
                            onClick={() => onEdit(exercise)}
                          >
                            <Pencil aria-hidden />
                            Editar
                          </Button>
                        ) : null}
                        {onDelete ? (
                          <ConfirmButton
                            label="Borrar"
                            confirmLabel="Sí, borrar"
                            size="sm"
                            aria-label={`Borrar ${exercise.name}`}
                            onConfirm={() => onDelete(exercise)}
                            className="text-muted-foreground"
                          />
                        ) : null}
                      </div>
                    ) : null}
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
