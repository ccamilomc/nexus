import { useState } from 'react'

import { useToday } from '@/core/time'
import { LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { toDateKey } from '@/shared/utils'

import { DayNavigator } from '../components/DayNavigator'
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

/**
 * Lo que se ha comido en un día, por comidas, con sus macros.
 *
 * Abre en hoy, que es lo que se apunta el 99 % de las veces, pero **se puede
 * retroceder**: olvidarse de la cena y acordarse al día siguiente es lo más
 * común que le pasa a la comida, y antes eso no había forma de arreglarlo.
 */
export function TodayPage() {
  // Una única referencia temporal para todo el render, que además se pone al
  // día sola si la pantalla se queda abierta y cruza la medianoche.
  const today = useToday()
  const [date, setDate] = useState(today)
  const { data, isPending, isError, error, refetch } = useDayNutrition(date)
  // Los objetivos son opcionales: si fallan o no existen, el día se ve igual.
  const { data: goal } = useActiveGoal()
  // Lo mismo con lo repetible: si no llega, se registra a mano como siempre.
  const { data: repeatable } = useRepeatableMeals(date)
  const { data: week, isPending: isWeekPending } = useWeekNutrition(date)
  const isToday = toDateKey(date) === toDateKey(today)

  if (isPending) return <SkeletonList label="Cargando lo de hoy" rows={4} rowClassName="h-28" />
  if (isError) return <LoadFailure message={error.message} onRetry={() => void refetch()} />
  if (!data) {
    return <LoadFailure message="No hemos podido leer lo de hoy." onRetry={() => void refetch()} />
  }

  return (
    <div className="space-y-4">
      <DayNavigator date={date} today={today} onChange={setDate} />

      <DaySummaryCard totals={data.totals} goal={goal ?? null} isToday={isToday} />

      <WaterCard date={date} />

      {/* Debajo del día y del agua: primero el día, que es sobre lo que aún se
          puede hacer algo, y después el patrón de la semana. */}
      <WeekNutritionCard
        week={week ?? null}
        goal={goal ?? null}
        date={date}
        today={today}
        isPending={isWeekPending}
      />

      <ul className="space-y-3">
        {data.meals.map((meal) => (
          <li key={meal.mealType}>
            <MealSection date={date} meal={meal} repeatable={repeatable?.[meal.mealType] ?? null} />
          </li>
        ))}
      </ul>
    </div>
  )
}
