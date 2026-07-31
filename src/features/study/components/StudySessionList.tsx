import { Trash2 } from 'lucide-react'

import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { formatTime } from '@/shared/utils'

import { useRemoveSession } from '../hooks/use-study'
import type { StudySessionWithSubject } from '../types/study.types'
import { formatMinutes } from '../utils/format'

interface StudySessionListProps {
  readonly sessions: readonly StudySessionWithSubject[]
}

/** Las sesiones del día, de la más reciente a la más antigua. */
export function StudySessionList({ sessions }: StudySessionListProps) {
  const removeSession = useRemoveSession()

  if (sessions.length === 0) return null

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">Sesiones de hoy</h2>

      {removeSession.isError ? <FormAlert>{removeSession.error.message}</FormAlert> : null}

      <ul className="space-y-2">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: session.subject?.color ?? 'currentColor' }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {session.subject?.name ?? 'Sin materia'}
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {formatTime(session.started_at)} · {formatMinutes(session.duration_minutes)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              className="text-muted-foreground hover:text-destructive"
              disabled={removeSession.isPending}
              aria-label={`Quitar la sesión de ${formatMinutes(session.duration_minutes)} de ${session.subject?.name ?? 'sin materia'}`}
              onClick={() => removeSession.mutate(session.id)}
            >
              <Trash2 aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
