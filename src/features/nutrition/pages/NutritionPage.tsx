import { useMemo } from 'react'

import { LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'
import { Card, CardContent } from '@/shared/components/ui/card'

import { MacroSummary } from '../components/MacroSummary'
import { MealSection } from '../components/MealSection'
import { useDayNutrition } from '../hooks/use-nutrition'

/** Lo que se ha comido hoy, por comidas, con los macros del día. */
export function NutritionPage() {
  // Una única referencia temporal para todo el render: si cambiara a media
  // pantalla, la consulta y los registros mirarían días distintos.
  const today = useMemo(() => new Date(), [])
  const { data, isPending, isError, error, refetch } = useDayNutrition(today)

  return (
    <>
      <PageHeader title="Nutrición" description="Lo que comes hoy, con sus macros." />

      {isPending ? (
        <SkeletonList label="Cargando lo de hoy" rows={4} rowClassName="h-28" />
      ) : isError ? (
        <LoadFailure message={error.message} onRetry={() => void refetch()} />
      ) : !data ? (
        <LoadFailure message="No hemos podido leer lo de hoy." onRetry={() => void refetch()} />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-2 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">
                Total de hoy
              </h2>
              <MacroSummary macros={data.totals} />
            </CardContent>
          </Card>

          <ul className="space-y-3">
            {data.meals.map((meal) => (
              <li key={meal.mealType}>
                <MealSection date={today} meal={meal} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
