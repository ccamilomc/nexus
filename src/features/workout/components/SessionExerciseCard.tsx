import { Trash2, X } from 'lucide-react'

import { useNow } from '@/core/time'
import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'

import { MUSCLE_GROUP_LABELS } from '../constants/workout.constants'
import { useRemoveSet } from '../hooks/use-workout-sets'
import type { LogSetValues } from '../schemas/workout.schema'
import type { ExerciseRef, LastPerformance, WorkoutSet } from '../types/workout.types'
import { formatPerformedSets, formatSessionDate, formatWeight } from '../utils/format'
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
  /** Qué se hizo la última vez en este ejercicio; `null` si es la primera. */
  readonly lastPerformance?: LastPerformance | undefined
}

/**
 * Qué proponer en el formulario de la siguiente serie.
 *
 * **Primero lo de hoy, y si no, lo del último día.** Dentro de una sesión se
 * repite la serie anterior; al empezar un ejercicio, lo natural es partir de lo
 * que se levantó la última vez, que es justo lo que uno intenta igualar o
 * superar. Antes se empezaba con el formulario vacío y había que acordarse.
 */
function toDefaultValues(
  sets: readonly WorkoutSet[],
  lastPerformance: LastPerformance | undefined,
): LogSetValues | null {
  const last = sets[sets.length - 1]
  if (last && last.reps !== null && last.weight !== null) {
    return { reps: last.reps, weightKg: last.weight }
  }

  const top = lastPerformance?.topSet
  return top ? { reps: top.reps, weightKg: top.weightKg } : null
}

/** Un ejercicio del entrenamiento con sus series y el registro de la siguiente. */
export function SessionExerciseCard({
  sessionId,
  exercise,
  sets,
  onSetLogged,
  onRemove,
  target,
  lastPerformance,
}: SessionExerciseCardProps) {
  const removeSet = useRemoveSet()
  const now = useNow()

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

        {/*
          La pregunta que uno se hace frente a la máquina es «¿cuánto puse la
          semana pasada?». Estaba guardado y no se enseñaba en ningún sitio, así
          que había que acordarse o entrenar a ciegas.
        */}
        {lastPerformance ? (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">La última vez</span>
            {` · ${formatSessionDate(lastPerformance.performedAt, now)} · `}
            <span className="tabular-nums">{formatPerformedSets(lastPerformance.sets)}</span>
          </p>
        ) : null}

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
          lastSet={toDefaultValues(sets, lastPerformance)}
          onLogged={onSetLogged}
        />
      </CardContent>
    </Card>
  )
}
