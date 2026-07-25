import { Play, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'

import { MUSCLE_GROUP_LABELS } from '../constants/workout.constants'
import { useActiveSession, useStartSessionFromRoutineDay } from '../hooks/use-active-session'
import { useRemoveRoutineDay, useRemoveRoutineExercise } from '../hooks/use-routine-detail'
import type { RoutineDayDetail } from '../types/workout.types'
import { formatTargets } from '../utils/format'
import { AddExerciseToDay } from './AddExerciseToDay'

interface RoutineDayCardProps {
  readonly routineId: string
  readonly detail: RoutineDayDetail
}

/** Un día de la rutina: sus ejercicios prescritos y cómo editarlos. */
export function RoutineDayCard({ routineId, detail }: RoutineDayCardProps) {
  const { day, exercises } = detail
  const [isAdding, setIsAdding] = useState(false)
  const removeDay = useRemoveRoutineDay(routineId)
  const removeExercise = useRemoveRoutineExercise(routineId)
  const startSession = useStartSessionFromRoutineDay()
  const { data: activeSession } = useActiveSession()
  const navigate = useNavigate()

  // Sólo puede haber un entrenamiento a la vez: si ya hay uno, no se ofrece
  // empezar otro (el service lo respeta, pero es mejor no invitar a hacerlo).
  const hasActiveSession = Boolean(activeSession)

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium">{day.name}</h3>
          <ConfirmButton
            label="Eliminar día"
            confirmLabel="Sí, eliminar"
            size="sm"
            disabled={removeDay.isPending}
            onConfirm={() => removeDay.mutate(day.id)}
            className="text-muted-foreground"
          />
        </div>

        {exercises.length > 0 ? (
          <ul className="space-y-1.5">
            {exercises.map((routineExercise) => (
              <li
                key={routineExercise.id}
                className="flex items-center justify-between gap-2 rounded-md bg-muted/50 py-1.5 pl-3 pr-1.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{routineExercise.exercise.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {MUSCLE_GROUP_LABELS[routineExercise.exercise.muscle_group]} ·{' '}
                    {formatTargets(
                      routineExercise.target_sets,
                      routineExercise.target_reps,
                      routineExercise.target_weight,
                    )}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  disabled={removeExercise.isPending}
                  aria-label={`Quitar ${routineExercise.exercise.name} del día ${day.name}`}
                  onClick={() => removeExercise.mutate(routineExercise.id)}
                >
                  <Trash2 aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Aún no hay ejercicios en este día.</p>
        )}

        {removeDay.isError ? <FormAlert>{removeDay.error.message}</FormAlert> : null}
        {removeExercise.isError ? <FormAlert>{removeExercise.error.message}</FormAlert> : null}
        {startSession.isError ? <FormAlert>{startSession.error.message}</FormAlert> : null}

        {exercises.length > 0 ? (
          <div className="space-y-1.5">
            <Button
              type="button"
              className="w-full"
              disabled={hasActiveSession || startSession.isPending}
              onClick={() =>
                startSession.mutate(day.id, { onSuccess: () => navigate(ROUTES.workout) })
              }
            >
              <Play aria-hidden />
              {startSession.isPending ? 'Iniciando…' : 'Entrenar este día'}
            </Button>
            {hasActiveSession ? (
              <p className="text-center text-xs text-muted-foreground">
                Ya tienes un entrenamiento en curso.
              </p>
            ) : null}
          </div>
        ) : null}

        {isAdding ? (
          <AddExerciseToDay
            routineId={routineId}
            dayId={day.id}
            excludedIds={exercises.map((routineExercise) => routineExercise.exercise.id)}
            onDone={() => setIsAdding(false)}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setIsAdding(true)}
          >
            <Plus aria-hidden />
            Añadir ejercicio
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
