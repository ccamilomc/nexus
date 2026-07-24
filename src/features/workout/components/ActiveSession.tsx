import { Check, Plus } from 'lucide-react'
import { useState } from 'react'

import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'

import { useDiscardSession, useFinishSession } from '../hooks/use-active-session'
import type { Exercise, ExerciseRef, SessionDetail, WorkoutSet } from '../types/workout.types'
import { ExercisePicker } from './ExercisePicker'
import { SessionExerciseCard } from './SessionExerciseCard'
import { SessionSummary } from './SessionSummary'
import { SessionTimer } from './SessionTimer'

interface ActiveSessionProps {
  readonly detail: SessionDetail
}

interface SessionItem {
  readonly exercise: ExerciseRef
  readonly sets: readonly WorkoutSet[]
}

/**
 * Entrenamiento en curso: sus ejercicios, sus series y el cierre de la sesión.
 *
 * Un ejercicio elegido pero todavía sin series sólo vive en esta pantalla: se
 * guarda al registrar su primera serie (ver docs/04-modelo-de-datos.md).
 */
export function ActiveSession({ detail }: ActiveSessionProps) {
  const { session, exercises, stats } = detail
  const [drafts, setDrafts] = useState<readonly Exercise[]>([])
  const [isPickerOpen, setIsPickerOpen] = useState(() => exercises.length === 0)
  const finishSession = useFinishSession()
  const discardSession = useDiscardSession()

  const loggedIds = exercises.map(({ exercise }) => exercise.id)
  const items: readonly SessionItem[] = [
    ...exercises,
    ...drafts
      .filter((exercise) => !loggedIds.includes(exercise.id))
      .map((exercise) => ({ exercise, sets: [] })),
  ]

  const forgetDraft = (exerciseId: string) =>
    setDrafts((current) => current.filter((exercise) => exercise.id !== exerciseId))

  const hasSets = stats.setCount > 0

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="space-y-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">
                Entrenamiento en curso
              </h2>
              <SessionTimer startedAt={session.started_at} />
            </div>
            <SessionSummary stats={stats} />
          </div>

          <div className="space-y-1.5">
            <Button
              type="button"
              disabled={!hasSets || finishSession.isPending}
              onClick={() => finishSession.mutate(session.id)}
            >
              <Check aria-hidden />
              {finishSession.isPending ? 'Guardando…' : 'Terminar'}
            </Button>
            {hasSets ? null : (
              <p className="max-w-40 text-xs text-muted-foreground">
                Registra una serie para poder terminar.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map(({ exercise, sets }) => (
            <li key={exercise.id}>
              <SessionExerciseCard
                sessionId={session.id}
                exercise={exercise}
                sets={sets}
                onSetLogged={() => forgetDraft(exercise.id)}
                onRemove={sets.length === 0 ? () => forgetDraft(exercise.id) : undefined}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {isPickerOpen ? (
        <ExercisePicker
          excludedIds={items.map(({ exercise }) => exercise.id)}
          onSelect={(exercise) => {
            setDrafts((current) => [...current, exercise])
            setIsPickerOpen(false)
          }}
          onClose={() => setIsPickerOpen(false)}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setIsPickerOpen(true)}
        >
          <Plus aria-hidden />
          Añadir ejercicio
        </Button>
      )}

      {finishSession.isError ? <FormAlert>{finishSession.error.message}</FormAlert> : null}
      {discardSession.isError ? <FormAlert>{discardSession.error.message}</FormAlert> : null}

      <div className="flex justify-center pt-2">
        <ConfirmButton
          label="Descartar entrenamiento"
          confirmLabel="Sí, descartar"
          size="sm"
          disabled={discardSession.isPending}
          onConfirm={() => discardSession.mutate(session.id)}
          className="text-muted-foreground"
        />
      </div>
    </div>
  )
}
