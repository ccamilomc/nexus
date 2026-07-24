import { Card, CardContent } from '@/shared/components/ui/card'

import type { SessionDetail } from '../types/workout.types'
import { formatSessionDate } from '../utils/format'
import { SessionSummary } from './SessionSummary'

interface SessionHistoryListProps {
  readonly sessions: readonly SessionDetail[]
  /** Momento de referencia para fechar («Hoy», «Ayer»). */
  readonly now: Date
}

/** Entrenamientos terminados, del más reciente al más antiguo. */
export function SessionHistoryList({ sessions, now }: SessionHistoryListProps) {
  return (
    <ul className="space-y-3">
      {sessions.map(({ session, exercises, stats }) => (
        <li key={session.id}>
          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="font-medium">{formatSessionDate(session.started_at, now)}</h2>

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
  )
}
