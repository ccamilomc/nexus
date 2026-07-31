import { Play, Square, Timer } from 'lucide-react'
import { useState } from 'react'

import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'
import { Select } from '@/shared/components/ui/select'
import { useElapsedSeconds } from '@/shared/hooks'
import { formatElapsed } from '@/shared/utils'

import {
  useDiscardStudySession,
  useFinishStudySession,
  useStartStudySession,
} from '../hooks/use-study'
import type { StudySessionWithSubject, Subject } from '../types/study.types'

interface StudyTimerCardProps {
  readonly subjects: readonly Subject[]
  readonly active: StudySessionWithSubject | null
}

/**
 * El cronómetro: estudiar ahora en lugar de apuntarlo después.
 *
 * El tiempo se cuenta desde la hora de inicio guardada en el servidor, así que
 * sobrevive a recargar la página o a cambiar de dispositivo: no es un contador
 * que viva en la pantalla.
 */
export function StudyTimerCard({ subjects, active }: StudyTimerCardProps) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '')
  const start = useStartStudySession()
  const finish = useFinishStudySession()
  const discard = useDiscardStudySession()

  const errorMessage =
    start.error?.message ?? finish.error?.message ?? discard.error?.message ?? null

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
          <Timer className="h-4 w-4" aria-hidden />
          Cronómetro
        </h2>

        {active ? (
          <RunningSession
            active={active}
            isBusy={finish.isPending || discard.isPending}
            onFinish={() => finish.mutate({ sessionId: active.id, startedAt: active.started_at })}
            onDiscard={() => discard.mutate(active.id)}
          />
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="timer-subject" className="mb-1 block text-sm font-medium">
                Materia
              </label>
              <Select
                id="timer-subject"
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              type="button"
              disabled={start.isPending}
              onClick={() => start.mutate(subjectId)}
            >
              <Play aria-hidden />
              {start.isPending ? 'Empezando…' : 'Empezar'}
            </Button>
          </div>
        )}

        {errorMessage ? <FormAlert>{errorMessage}</FormAlert> : null}
      </CardContent>
    </Card>
  )
}

interface RunningSessionProps {
  readonly active: StudySessionWithSubject
  readonly isBusy: boolean
  readonly onFinish: () => void
  readonly onDiscard: () => void
}

/** La sesión en marcha: qué se estudia, cuánto lleva y cómo terminarla. */
function RunningSession({ active, isBusy, onFinish, onDiscard }: RunningSessionProps) {
  const seconds = useElapsedSeconds(active.started_at)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: active.subject?.color ?? 'currentColor' }}
          aria-hidden
        />
        <p className="min-w-0 flex-1 truncate text-sm font-medium">
          {active.subject?.name ?? 'Sin materia'}
        </p>
        {/* role="timer" evita que el lector de pantalla anuncie cada segundo. */}
        <span
          role="timer"
          aria-label="Tiempo estudiando"
          className="text-2xl font-semibold tabular-nums"
        >
          {formatElapsed(seconds)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={isBusy} onClick={onFinish}>
          <Square aria-hidden />
          Terminar
        </Button>
        <ConfirmButton
          label="Descartar"
          confirmLabel="Sí, descartar"
          disabled={isBusy}
          onConfirm={onDiscard}
          className="text-muted-foreground"
        />
      </div>
    </div>
  )
}
