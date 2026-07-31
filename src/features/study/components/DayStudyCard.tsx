import { Clock } from 'lucide-react'

import { Skeleton } from '@/shared/components/feedback'
import { Card, CardContent } from '@/shared/components/ui/card'

import type { DayStudy } from '../types/study.types'
import { formatMinutes } from '../utils/format'

interface DayStudyCardProps {
  readonly day: DayStudy | null
  readonly isPending: boolean
}

/** Lo estudiado hoy: el total y en qué se repartió. */
export function DayStudyCard({ day, isPending }: DayStudyCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Clock className="h-4 w-4" aria-hidden />
            Hoy
          </h2>
          {isPending ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <p className="text-lg font-semibold tabular-nums">
              {formatMinutes(day?.totalMinutes ?? 0)}
            </p>
          )}
        </div>

        {day && day.bySubject.length > 0 ? (
          <ul className="space-y-1.5">
            {day.bySubject.map(({ subject, minutes }) => (
              <li key={subject.id} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: subject.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{subject.name}</span>
                <span className="tabular-nums text-muted-foreground">{formatMinutes(minutes)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}
