import { RotateCcw } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'

import { MEAL_TYPE_ARTICLES, MEAL_TYPE_LABELS } from '../constants/nutrition.constants'
import type { MealType, RepeatableMeal } from '../types/nutrition.types'

interface RepeatMealOptionsProps {
  readonly date: Date
  readonly mealType: MealType
  readonly options: readonly RepeatableMeal[]
  readonly onPick: (option: RepeatableMeal) => void
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

/** Los alimentos de la combinación, en corto. */
function describeFoods(option: RepeatableMeal): string {
  const names = option.items.map((item) => item.food.name)

  return names.length <= 2 ? names.join(' y ') : `${names[0]} y ${names.length - 1} más`
}

/**
 * Lo que sueles comer en esta comida, para volver a apuntarlo.
 *
 * Registrar lo de a diario era el paso más caro de la aplicación: abrir, buscar
 * entre decenas de alimentos y poner cantidad, por cada cosa del plato.
 *
 * **Se ofrecen varias combinaciones, no sólo la última**, porque uno no come
 * siempre lo mismo: está el desayuno de diario y el de los días con prisa. Van
 * ordenadas por lo que más se repite, y salen de lo ya registrado — no hay nada
 * que nombrar ni mantener al día.
 *
 * Al elegir una **no se guarda todavía**: se abre el paso de cantidades con sus
 * alimentos puestos, para quitar lo que hoy no se comió o cambiar las porciones.
 * La vez anterior es un punto de partida, no un calco.
 *
 * Se dice **qué** lleva y **de cuándo** es: repetir a ciegas daría menos
 * confianza que teclearlo.
 */
export function RepeatMealOptions({ date, mealType, options, onPick }: RepeatMealOptionsProps) {
  if (options.length === 0) return null

  return (
    <ul className="space-y-2">
      {options.map((option) => (
        <li key={option.key}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start"
            aria-label={`Repetir ${MEAL_TYPE_ARTICLES[mealType]} ${MEAL_TYPE_LABELS[
              mealType
            ].toLowerCase()} ${describeWhen(option.loggedAt, date)}: ${option.items
              .map((item) => item.food.name)
              .join(', ')}`}
            onClick={() => onPick(option)}
          >
            <RotateCcw aria-hidden />
            <span className="min-w-0 flex-1 truncate text-left">
              {describeFoods(option)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {/* Las veces sólo se dicen cuando aportan: «1 vez» es ruido, y
                    con dos o más es lo que explica por qué sale la primera. */}
                {option.times > 1
                  ? `· ${option.times} veces`
                  : `· ${describeWhen(option.loggedAt, date)}`}
              </span>
            </span>
          </Button>
        </li>
      ))}
    </ul>
  )
}
