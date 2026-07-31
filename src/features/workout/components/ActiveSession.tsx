import { Check, Plus } from 'lucide-react'
import { useState } from 'react'

import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'

import { useDiscardSession, useFinishSession } from '../hooks/use-active-session'
import type { Exercise, SessionDetail } from '../types/workout.types'
import { formatOptionalTargets } from '../utils/format'
import { buildSessionItems } from '../utils/session-items'
import { ExercisePicker } from './ExercisePicker'
import { SessionExerciseCard } from './SessionExerciseCard'
import { SessionSummary } from './SessionSummary'
import { SessionTimer } from './SessionTimer'

interface ActiveSessionProps {
  readonly detail: SessionDetail
}

/**
 * Entrenamiento en curso: sus ejercicios, sus series y el cierre de la sesión.
 *
 * Un ejercicio elegido a mano pero todavía sin series sólo vive en esta
 * pantalla: se guarda al registrar su primera serie. Los que vienen de una
 * rutina se leen del plan, así que sobreviven a una recarga
 * (ver docs/04-modelo-de-datos.md).
 */
export function ActiveSession({ detail }: ActiveSessionProps) {
  const { session, exercises, stats, plan } = detail
  const [drafts, setDrafts] = useState<readonly Exercise[]>([])
  // Con un plan detrás no hace falta abrir el selector: ya hay qué hacer.
  const [isPickerOpen, setIsPickerOpen] = useState(() => exercises.length === 0 && plan === null)
  const finishSession = useFinishSession()
  const discardSession = useDiscardSession()

  const items = buildSessionItems(exercises, plan, drafts)

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
              {plan ? <p className="text-sm font-medium">{plan.day.name}</p> : null}
              <SessionTimer startedAt={session.started_at} />
            </div>
            <SessionSummary stats={stats} />
          </div>

          {/*
            Terminar y descartar van juntos: son las dos salidas de la sesión.
            Con el descartar al final de la pantalla, quien empezó sin querer
            tenía que recorrer todo el catálogo de ejercicios para encontrarlo.
          */}
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
            <ConfirmButton
              label="Descartar"
              confirmLabel="Sí, descartar"
              size="sm"
              disabled={discardSession.isPending}
              onConfirm={() => discardSession.mutate(session.id)}
              className="text-muted-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map(({ exercise, sets, prescribed, canRemove }) => {
            const target = prescribed
              ? formatOptionalTargets(
                  prescribed.target_sets,
                  prescribed.target_reps,
                  prescribed.target_weight,
                )
              : null

            return (
              <li key={exercise.id}>
                <SessionExerciseCard
                  sessionId={session.id}
                  exercise={exercise}
                  sets={sets}
                  onSetLogged={() => forgetDraft(exercise.id)}
                  onRemove={canRemove ? () => forgetDraft(exercise.id) : undefined}
                  {...(target ? { target } : {})}
                />
              </li>
            )
          })}
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
    </div>
  )
}
