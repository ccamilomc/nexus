import { RotateCcw } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'

import { MEAL_TYPE_ARTICLES, MEAL_TYPE_LABELS } from '../constants/nutrition.constants'
import { useRepeatMeal } from '../hooks/use-nutrition'
import type { MealType, RepeatableMeal } from '../types/nutrition.types'

interface RepeatMealButtonProps {
  readonly date: Date
  readonly mealType: MealType
  readonly template: RepeatableMeal
}

/** «Ayer», «el martes»… mejor que una fecha para algo tan reciente. */
function describeWhen(iso: string, today: Date): string {
  const when = new Date(iso)
  const days = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(when.getFullYear(), when.getMonth(), when.getDate()).getTime()) /
      86_400_000,
  )

  if (days <= 1) return 'de ayer'
  if (days < 7) return `del ${when.toLocaleDateString('es-CO', { weekday: 'long' })}`

  return `del ${when.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}`
}

/**
 * Repite la última vez que se registró esta comida.
 *
 * Registrar lo que uno come a diario era el paso más caro de la aplicación:
 * abrir, buscar entre decenas de alimentos, poner cantidad, y otra vez por cada
 * cosa del plato. Si hoy se come lo mismo que el martes, esto lo deja en un
 * toque. Se dice **qué** se va a copiar y **de cuándo**: repetir a ciegas daría
 * menos confianza que teclearlo.
 */
export function RepeatMealButton({ date, mealType, template }: RepeatMealButtonProps) {
  const repeatMeal = useRepeatMeal()
  const names = template.items.map((item) => item.food.name)
  const preview = names.length <= 2 ? names.join(' y ') : `${names[0]} y ${names.length - 1} más`

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full"
      disabled={repeatMeal.isPending}
      aria-label={`Repetir ${MEAL_TYPE_ARTICLES[mealType]} ${MEAL_TYPE_LABELS[mealType].toLowerCase()} ${describeWhen(template.loggedAt, date)}: ${names.join(', ')}`}
      onClick={() => repeatMeal.mutate({ date, mealType })}
    >
      <RotateCcw aria-hidden />
      {repeatMeal.isPending ? 'Repitiendo…' : `Repetir ${describeWhen(template.loggedAt, date)}`}
      <span className="truncate text-xs font-normal text-muted-foreground">· {preview}</span>
    </Button>
  )
}
