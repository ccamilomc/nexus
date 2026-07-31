import { CalendarRange } from 'lucide-react'

import { Skeleton } from '@/shared/components/feedback'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { formatMinutes } from '@/shared/utils'

import type { SubjectWeek, WeekStudy } from '../types/study.types'

interface WeekStudyCardProps {
  readonly week: WeekStudy | null
  readonly isPending: boolean
}

/**
 * Cómo va la semana frente a lo que uno se propuso.
 *
 * Es la pregunta que el total de hoy no puede contestar: una jornada floja no
 * significa nada, cuatro seguidas sí. La semana va de lunes a domingo, como el
 * presupuesto de nutrición.
 */
export function WeekStudyCard({ week, isPending }: WeekStudyCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <CalendarRange className="h-4 w-4" aria-hidden />
            Esta semana
          </h2>
          {isPending ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="text-lg font-semibold tabular-nums">
              {formatMinutes(week?.totalMinutes ?? 0)}
              {week?.targetMinutes === null || week === null ? null : (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  / {formatMinutes(week.targetMinutes)}
                </span>
              )}
            </p>
          )}
        </div>

        {week?.progress ? (
          <div className="space-y-1">
            <Progress
              value={week.progress.percent}
              label={`Estudio de la semana: ${week.progress.percent}% del objetivo`}
            />
            <p className="text-xs text-muted-foreground">
              {week.progress.remaining === 0
                ? '¡Objetivo de la semana cumplido!'
                : `Te faltan ${formatMinutes(week.progress.remaining)}.`}
            </p>
          </div>
        ) : null}

        {week && week.bySubject.length > 0 ? (
          <ul className="space-y-2.5 pt-1">
            {week.bySubject.map((entry) => (
              <SubjectWeekRow key={entry.subject.id} entry={entry} />
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}

/** Una materia en la semana: su tiempo y, si lo hay, su avance. */
function SubjectWeekRow({ entry }: { readonly entry: SubjectWeek }) {
  const { subject, minutes, targetMinutes, progress } = entry

  return (
    <li className="space-y-1">
      <div className="flex items-center gap-2 text-sm">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: subject.color }}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate">{subject.name}</span>
        <span className="tabular-nums text-muted-foreground">
          {formatMinutes(minutes)}
          {targetMinutes === null ? null : ` / ${formatMinutes(targetMinutes)}`}
        </span>
      </div>
      {progress ? (
        <Progress
          value={progress.percent}
          label={`${subject.name}: ${progress.percent}% del objetivo semanal`}
        />
      ) : null}
    </li>
  )
}
