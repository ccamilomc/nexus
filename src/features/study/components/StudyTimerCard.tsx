import { Play, Square, Timer } from 'lucide-react'
import { useState } from 'react'

import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ConfirmButton } from '@/shared/components/ui/confirm-button'
import { Progress } from '@/shared/components/ui/progress'
import { Select } from '@/shared/components/ui/select'
import { useElapsedSeconds } from '@/shared/hooks'
import { cn } from '@/shared/lib/utils'
import { formatElapsed } from '@/shared/utils'

import {
  useDiscardStudySession,
  useFinishStudySession,
  useStartStudySession,
} from '../hooks/use-study'
import type { StudySessionWithSubject, Subject } from '../types/study.types'
import { BLOCK_OPTIONS, blockProgress } from '../utils/study-block'

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
  // Sin límite por defecto: es como funcionaba y no todo rato de estudio se
  // planea. Elegir bloque es una decisión, no un trámite obligatorio.
  const [targetMinutes, setTargetMinutes] = useState<number | null>(null)
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
          // Se elige antes de empezar, y ese orden importa: con el botón
          // arriba, quien pulsaba «Empezar» arrancaba sin límite sin haber
          // llegado a ver que podía elegir cuánto durar.
          <div className="space-y-3">
            <div className="max-w-sm">
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

            <fieldset>
              <legend className="mb-1.5 text-sm font-medium">¿Cuánto quieres que dure?</legend>
              <div className="flex flex-wrap gap-2">
                {BLOCK_OPTIONS.map(({ minutes, label }) => (
                  <Button
                    key={minutes}
                    type="button"
                    size="sm"
                    variant={targetMinutes === minutes ? 'default' : 'outline'}
                    aria-pressed={targetMinutes === minutes}
                    onClick={() => setTargetMinutes(minutes)}
                  >
                    {label}
                  </Button>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant={targetMinutes === null ? 'default' : 'outline'}
                  aria-pressed={targetMinutes === null}
                  onClick={() => setTargetMinutes(null)}
                >
                  Sin límite
                </Button>
              </div>
            </fieldset>

            <Button
              type="button"
              disabled={start.isPending}
              onClick={() => start.mutate({ subjectId, targetMinutes })}
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
  const block = blockProgress(seconds, active.target_minutes)

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

      {/* El bloque no corta la sesión al cumplirse: se avisa y se sigue
          contando. Nexus propone una duración, no la impone. */}
      {block ? (
        <div className="space-y-1.5">
          <Progress
            value={block.percent}
            label={`Bloque de ${active.target_minutes} min: ${Math.round(block.percent)} %`}
          />
          <p className={cn('text-xs', block.isDone ? 'text-success' : 'text-muted-foreground')}>
            {block.isDone
              ? block.overtimeSeconds > 0
                ? `Bloque de ${active.target_minutes} min cumplido, y llevas ${formatElapsed(block.overtimeSeconds)} de más.`
                : `Bloque de ${active.target_minutes} min cumplido. Puedes parar o seguir.`
              : `Quedan ${formatElapsed(block.remainingSeconds)} de tu bloque de ${active.target_minutes} min.`}
          </p>
        </div>
      ) : null}

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
