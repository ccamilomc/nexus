import { useToday } from '@/core/time'
import { LoadFailure, SkeletonList } from '@/shared/components/feedback'

import { DaySummaryCard } from '../components/DaySummaryCard'
import { MealSection } from '../components/MealSection'
import { WaterCard } from '../components/WaterCard'
import { WeekNutritionCard } from '../components/WeekNutritionCard'
import {
  useActiveGoal,
  useDayNutrition,
  useRepeatableMeals,
  useWeekNutrition,
} from '../hooks/use-nutrition'

/** Lo que se ha comido hoy, por comidas, con los macros del día. */
export function TodayPage() {
  // Una única referencia temporal para todo el render, que además se pone al
  // día sola si la pantalla se queda abierta y cruza la medianoche.
  const today = useToday()
  const { data, isPending, isError, error, refetch } = useDayNutrition(today)
  // Los objetivos son opcionales: si fallan o no existen, el día se ve igual.
  const { data: goal } = useActiveGoal()
  // Lo mismo con lo repetible: si no llega, se registra a mano como siempre.
  const { data: repeatable } = useRepeatableMeals(today)
  const { data: week, isPending: isWeekPending } = useWeekNutrition(today)

  if (isPending) return <SkeletonList label="Cargando lo de hoy" rows={4} rowClassName="h-28" />
  if (isError) return <LoadFailure message={error.message} onRetry={() => void refetch()} />
  if (!data) {
    return <LoadFailure message="No hemos podido leer lo de hoy." onRetry={() => void refetch()} />
  }

  return (
    <div className="space-y-4">
      <DaySummaryCard totals={data.totals} goal={goal ?? null} />

      <WaterCard date={today} />

      {/* Debajo del día y del agua: primero lo de hoy, que es sobre lo que aún
          se puede hacer algo, y después el patrón de la semana. */}
      <WeekNutritionCard week={week ?? null} goal={goal ?? null} isPending={isWeekPending} />

      <ul className="space-y-3">
        {data.meals.map((meal) => (
          <li key={meal.mealType}>
            <MealSection
              date={today}
              meal={meal}
              repeatable={repeatable?.[meal.mealType] ?? null}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
