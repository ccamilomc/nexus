import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { Card, CardContent } from '@/shared/components/ui/card'

import type { Macros, NutritionGoal } from '../types/nutrition.types'
import { formatCalories, formatGrams } from '../utils/format'
import { calculateProgress } from '../utils/goal-progress'
import { GoalProgressRow } from './GoalProgressRow'
import { MacroSummary } from './MacroSummary'

interface DaySummaryCardProps {
  readonly totals: Macros
  /** Sin objetivos sólo se muestran las cifras: no hay contra qué comparar. */
  readonly goal: NutritionGoal | null
}

/** El total del día: cifras a secas, o avance hacia los objetivos si los hay. */
export function DaySummaryCard({ totals, goal }: DaySummaryCardProps) {
  const targets = goal
    ? [
        {
          label: 'Calorías',
          consumed: totals.calories,
          target: goal.calories_target,
          format: formatCalories,
        },
        {
          label: 'Proteína',
          consumed: totals.proteinG,
          target: goal.protein_g_target,
          format: formatGrams,
        },
        {
          label: 'Carbos',
          consumed: totals.carbsG,
          target: goal.carbs_g_target,
          format: formatGrams,
        },
        { label: 'Grasa', consumed: totals.fatG, target: goal.fat_g_target, format: formatGrams },
      ]
    : []

  // `flatMap` en vez de `filter`: así el tipo ya sabe que no hay nulos y no
  // hace falta forzarlo.
  const rows = targets.flatMap(({ label, consumed, target, format }) => {
    const progress = calculateProgress(consumed, target)
    return progress ? [{ label, progress, format }] : []
  })

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">Total de hoy</h2>

        {rows.length > 0 ? (
          <div className="space-y-4">
            {rows.map(({ label, progress, format }) => (
              <GoalProgressRow key={label} label={label} progress={progress} format={format} />
            ))}
          </div>
        ) : (
          <>
            <MacroSummary macros={totals} />
            <p className="text-xs text-muted-foreground">
              <Link to={ROUTES.nutritionGoals} className="underline hover:text-foreground">
                Fija tus objetivos
              </Link>{' '}
              para ver cuánto te falta cada día.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
