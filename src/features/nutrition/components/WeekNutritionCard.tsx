import { CalendarRange } from 'lucide-react'

import { Skeleton } from '@/shared/components/feedback'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { calculateProgress } from '@/shared/utils'

import type { NutritionGoal, WeekNutrition } from '../types/nutrition.types'
import { formatCalories, formatGrams } from '../utils/format'

interface WeekNutritionCardProps {
  readonly week: WeekNutrition | null
  readonly goal: NutritionGoal | null
  readonly isPending: boolean
}

/**
 * Cómo va la semana de comida, en medias por día.
 *
 * Es la pregunta que el total de hoy no puede contestar: quedarse corto de
 * proteína un día no significa nada, cuatro seguidos son un patrón. La semana va
 * de lunes a domingo, como la de estudio.
 *
 * **Se dice sobre cuántos días se promedia.** La media reparte entre los días
 * registrados y no entre siete —un día sin apuntar no es un día de ayuno—, así
 * que sin ese dato no se sabe si son cinco días o son dos.
 *
 * No lleva «te faltan»: eso es del día, donde aún se puede hacer algo. Aquí sólo
 * se enseña el patrón.
 */
export function WeekNutritionCard({ week, goal, isPending }: WeekNutritionCardProps) {
  if (isPending) {
    return (
      <Card>
        <CardContent className="space-y-3 p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-16" />
        </CardContent>
      </Card>
    )
  }

  // Sin días suficientes no se enseña nada: una media de un día es el día que ya
  // está arriba, con otro nombre.
  if (!week) return null

  const rows = goal
    ? [
        {
          label: 'Calorías',
          value: week.averages.calories,
          target: goal.calories_target,
          format: formatCalories,
        },
        {
          label: 'Proteína',
          value: week.averages.proteinG,
          target: goal.protein_g_target,
          format: formatGrams,
        },
        {
          label: 'Carbos',
          value: week.averages.carbsG,
          target: goal.carbs_g_target,
          format: formatGrams,
        },
        {
          label: 'Grasa',
          value: week.averages.fatG,
          target: goal.fat_g_target,
          format: formatGrams,
        },
      ]
    : []

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <CalendarRange className="h-4 w-4" aria-hidden />
            Esta semana
          </h2>
          <p className="text-xs text-muted-foreground">
            {week.daysLogged} de {week.daysInWeek} días apuntados
          </p>
        </div>

        <p className="text-2xl font-semibold tabular-nums">
          {formatCalories(week.averages.calories)}{' '}
          {/* El espacio va en el texto y no sólo en el margen: quien lo escucha
              no oye los márgenes, y se leería «1883 kcalde media». */}
          <span className="text-sm font-normal text-muted-foreground">de media al día</span>
        </p>

        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            P {formatGrams(week.averages.proteinG)} · C {formatGrams(week.averages.carbsG)} · G{' '}
            {formatGrams(week.averages.fatG)}
          </p>
        ) : (
          <ul className="space-y-2 pt-1">
            {rows.map(({ label, value, target, format }) => (
              <WeekMacroRow
                key={label}
                label={label}
                value={value}
                target={target}
                format={format}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

interface WeekMacroRowProps {
  readonly label: string
  readonly value: number
  readonly target: number | null
  readonly format: (value: number) => string
}

/** Un macro: su media diaria frente al objetivo de un día. */
function WeekMacroRow({ label, value, target, format }: WeekMacroRowProps) {
  // Sin objetivo se enseña la media a secas: no hay contra qué medirla.
  const progress = target === null ? null : calculateProgress(value, target)

  return (
    <li className="space-y-1">
      <div className="flex items-baseline gap-2 text-sm">
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {format(value)}
          {target === null ? null : ` / ${format(target)}`}
        </span>
      </div>
      {progress ? (
        <Progress
          value={progress.percent}
          label={`${label}: ${progress.percent}% del objetivo diario, de media esta semana`}
          isExceeded={progress.isExceeded}
        />
      ) : null}
    </li>
  )
}
