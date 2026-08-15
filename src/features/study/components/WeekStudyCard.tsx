import { CalendarRange } from 'lucide-react'

import { Skeleton } from '@/shared/components/feedback'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { formatMinutes } from '@/shared/utils'

import type { SubjectWeek, WeekStudy } from '../types/study.types'
import { weeklyPace } from '../utils/weekly-pace'

interface WeekStudyCardProps {
  readonly week: WeekStudy | null
  readonly isPending: boolean
  readonly today: Date
}

/**
 * En estudio, llegar al objetivo es un logro, no un aviso.
 *
 * Sin esto las tres materias salían del mismo morado: las dos que ya estaban
 * hechas pesaban lo mismo a la vista que la que iba por un cuarto, y había que
 * leer los números para saber qué tocaba. El color no es la única señal — el
 * tiempo y el objetivo van escritos al lado.
 */
function doneTone(isDone: boolean) {
  return isDone ? ('success' as const) : ('default' as const)
}

/**
 * Lo que falta, dicho de forma que se pueda hacer algo hoy.
 *
 * La cifra suelta —«te faltan 4 h 50 min»— era la misma un lunes que un
 * domingo. Repartida entre los días que quedan, dice qué toca hoy.
 */
function remainingText(remaining: number, today: Date): string {
  if (remaining === 0) return '¡Objetivo de la semana cumplido!'

  const pace = weeklyPace(remaining, today)
  const falta = `Te faltan ${formatMinutes(remaining)}`

  if (pace === null) return `${falta}.`
  if (pace.daysLeft === 1) return `${falta} y hoy acaba la semana.`

  return `${falta}: ${formatMinutes(pace.perDayMinutes)} al día para llegar el domingo.`
}

/**
 * Cómo va la semana frente a lo que uno se propuso.
 *
 * Es la pregunta que el total de hoy no puede contestar: una jornada floja no
 * significa nada, cuatro seguidas sí. La semana va de lunes a domingo, como el
 * presupuesto de nutrición.
 */
export function WeekStudyCard({ week, isPending, today }: WeekStudyCardProps) {
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
              tone={doneTone(week.progress.remaining === 0)}
            />
            <p className="text-xs text-muted-foreground">
              {remainingText(week.progress.remaining, today)}
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
          tone={doneTone(progress.remaining === 0)}
        />
      ) : null}
    </li>
  )
}
