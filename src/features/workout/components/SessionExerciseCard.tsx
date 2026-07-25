import { Trash2, X } from 'lucide-react'

import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'

import { MUSCLE_GROUP_LABELS } from '../constants/workout.constants'
import { useRemoveSet } from '../hooks/use-workout-sets'
import type { LogSetValues } from '../schemas/workout.schema'
import type { ExerciseRef, WorkoutSet } from '../types/workout.types'
import { formatWeight } from '../utils/format'
import { LogSetForm } from './LogSetForm'

interface SessionExerciseCardProps {
  readonly sessionId: string
  readonly exercise: ExerciseRef
  readonly sets: readonly WorkoutSet[]
  readonly onSetLogged: () => void
  /** Presente sólo mientras el ejercicio no tenga ninguna serie registrada. */
  readonly onRemove?: (() => void) | undefined
  /** Objetivo que prescribe la rutina (`4×8 · 80 kg`), si viene de un plan. */
  readonly target?: string | undefined
}

/** Valores de la última serie, para proponerlos en la siguiente. */
function toLastSetValues(sets: readonly WorkoutSet[]): LogSetValues | null {
  const last = sets[sets.length - 1]
  if (!last || last.reps === null || last.weight === null) return null

  return { reps: last.reps, weightKg: last.weight }
}

/** Un ejercicio del entrenamiento con sus series y el registro de la siguiente. */
export function SessionExerciseCard({
  sessionId,
  exercise,
  sets,
  onSetLogged,
  onRemove,
  target,
}: SessionExerciseCardProps) {
  const removeSet = useRemoveSet()

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-medium">{exercise.name}</h3>
            <p className="text-xs text-muted-foreground">
              {MUSCLE_GROUP_LABELS[exercise.muscle_group]}
              {target ? ` · Objetivo: ${target}` : ''}
            </p>
          </div>

          {onRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Quitar ${exercise.name} del entrenamiento`}
              onClick={onRemove}
            >
              <X aria-hidden />
            </Button>
          ) : null}
        </div>

        {sets.length > 0 ? (
          <ol className="space-y-1.5">
            {sets.map((set, index) => (
              <li
                key={set.id}
                className="flex items-center justify-between gap-2 rounded-md bg-muted/50 py-1.5 pl-3 pr-1.5 text-sm"
              >
                <span className="text-muted-foreground">Serie {index + 1}</span>
                <span className="flex-1 text-right tabular-nums">
                  {set.reps} reps · {formatWeight(set.weight)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="iconSm"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={removeSet.isPending}
                  aria-label={`Eliminar la serie ${index + 1} de ${exercise.name}`}
                  onClick={() => removeSet.mutate(set.id)}
                >
                  <Trash2 aria-hidden />
                </Button>
              </li>
            ))}
          </ol>
        ) : null}

        {removeSet.isError ? <FormAlert>{removeSet.error.message}</FormAlert> : null}

        <LogSetForm
          sessionId={sessionId}
          exerciseId={exercise.id}
          exerciseName={exercise.name}
          lastSet={toLastSetValues(sets)}
          onLogged={onSetLogged}
        />
      </CardContent>
    </Card>
  )
}
