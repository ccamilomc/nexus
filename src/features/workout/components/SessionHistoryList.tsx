import { Pencil } from 'lucide-react'

import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'

import { useRemoveSession, useReopenSession } from '../hooks/use-active-session'
import type { SessionDetail } from '../types/workout.types'
import { formatSessionDate } from '../utils/format'
import { SessionSummary } from './SessionSummary'

interface SessionHistoryListProps {
  readonly sessions: readonly SessionDetail[]
  /** Momento de referencia para fechar («Hoy», «Ayer»). */
  readonly now: Date
}

/**
 * Entrenamientos terminados, del más reciente al más antiguo.
 *
 * **Se pueden corregir y borrar.** Un peso mal tecleado o un ejercicio que no
 * era se quedaban ahí para siempre: descartar sólo valía para la sesión en
 * curso, y una guardada no lo está. Corregir la reabre en la pantalla de
 * siempre, que es donde ya se añaden y se quitan series.
 */
export function SessionHistoryList({ sessions, now }: SessionHistoryListProps) {
  const reopenSession = useReopenSession()
  const removeSession = useRemoveSession()

  return (
    <div className="space-y-3">
      {/* El aviso va arriba y no en la tarjeta: el motivo por el que no se puede
          corregir —hay otro entrenamiento en curso— no es de una fila concreta. */}
      {reopenSession.isError ? <FormAlert>{reopenSession.error.message}</FormAlert> : null}
      {removeSession.isError ? <FormAlert>{removeSession.error.message}</FormAlert> : null}

      <ul className="space-y-3">
        {sessions.map(({ session, exercises, stats }) => (
          <li key={session.id}>
            <Card>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-medium">{formatSessionDate(session.started_at, now)}</h2>

                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={reopenSession.isPending}
                      aria-label={`Corregir el entrenamiento del ${formatSessionDate(session.started_at, now)}`}
                      onClick={() => reopenSession.mutate(session.id)}
                    >
                      <Pencil aria-hidden />
                      Corregir
                    </Button>
                    <ConfirmButton
                      label="Borrar"
                      confirmLabel="Sí, borrar"
                      size="sm"
                      disabled={removeSession.isPending}
                      aria-label={`Borrar el entrenamiento del ${formatSessionDate(session.started_at, now)}`}
                      onConfirm={() => removeSession.mutate(session.id)}
                      className="text-muted-foreground"
                    />
                  </div>
                </div>

                <SessionSummary stats={stats} withDuration />

                <ul className="flex flex-wrap gap-1.5">
                  {exercises.map(({ exercise, sets }) => (
                    <li
                      key={exercise.id}
                      className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {exercise.name}
                      <span className="tabular-nums"> · {sets.length}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
