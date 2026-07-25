import { useMemo } from 'react'

import { LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { Card, CardContent } from '@/shared/components/ui/card'

import { MacroSummary } from '../components/MacroSummary'
import { MealSection } from '../components/MealSection'
import { WaterCard } from '../components/WaterCard'
import { useDayNutrition } from '../hooks/use-nutrition'

/** Lo que se ha comido hoy, por comidas, con los macros del día. */
export function TodayPage() {
  // Una única referencia temporal para todo el render: si cambiara a media
  // pantalla, la consulta y los registros mirarían días distintos.
  const today = useMemo(() => new Date(), [])
  const { data, isPending, isError, error, refetch } = useDayNutrition(today)

  if (isPending) return <SkeletonList label="Cargando lo de hoy" rows={4} rowClassName="h-28" />
  if (isError) return <LoadFailure message={error.message} onRetry={() => void refetch()} />
  if (!data) {
    return <LoadFailure message="No hemos podido leer lo de hoy." onRetry={() => void refetch()} />
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-2 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">
            Total de hoy
          </h2>
          <MacroSummary macros={data.totals} />
        </CardContent>
      </Card>

      <WaterCard date={today} />

      <ul className="space-y-3">
        {data.meals.map((meal) => (
          <li key={meal.mealType}>
            <MealSection date={today} meal={meal} />
          </li>
        ))}
      </ul>
    </div>
  )
}
