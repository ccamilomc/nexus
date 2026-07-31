import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'

import { MEAL_TYPE_LABELS } from '../constants/nutrition.constants'
import { useRemoveMealItem } from '../hooks/use-nutrition'
import type { Food, MealEntry, RepeatableMeal } from '../types/nutrition.types'
import { formatCalories, formatQuantity } from '../utils/format'
import { macrosForServings } from '../utils/macros'
import { AddFoodForm } from './AddFoodForm'
import { FoodPicker } from './FoodPicker'
import { MacroSummary } from './MacroSummary'
import { RepeatMealButton } from './RepeatMealButton'

interface MealSectionProps {
  readonly date: Date
  readonly meal: MealEntry
  /** Qué se puede repetir en esta comida; `null` si no hay nada anterior. */
  readonly repeatable: RepeatableMeal | null
}

/** Una comida del día: lo que se registró en ella y cómo añadir más. */
export function MealSection({ date, meal, repeatable }: MealSectionProps) {
  const [isPicking, setIsPicking] = useState(false)
  const [selected, setSelected] = useState<Food | null>(null)
  const removeItem = useRemoveMealItem()
  const isEmpty = meal.items.length === 0

  const close = () => {
    setIsPicking(false)
    setSelected(null)
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div>
          <h2 className="font-medium">{MEAL_TYPE_LABELS[meal.mealType]}</h2>
          {meal.items.length > 0 ? <MacroSummary macros={meal.macros} compact /> : null}
        </div>

        {meal.items.length > 0 ? (
          <ul className="space-y-1.5">
            {meal.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-md bg-muted/50 py-1.5 pl-3 pr-1.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.food.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatQuantity(item.food, item.servings)} ·{' '}
                    {formatCalories(macrosForServings(item.food, item.servings).calories)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="iconSm"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={removeItem.isPending}
                  aria-label={`Quitar ${item.food.name} de ${MEAL_TYPE_LABELS[meal.mealType]}`}
                  onClick={() => removeItem.mutate(item.id)}
                >
                  <Trash2 aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Sin registros.</p>
        )}

        {removeItem.isError ? <FormAlert>{removeItem.error.message}</FormAlert> : null}

        {selected ? (
          <AddFoodForm
            date={date}
            mealType={meal.mealType}
            food={selected}
            onAdded={close}
            onBack={() => setSelected(null)}
          />
        ) : isPicking ? (
          <FoodPicker onSelect={setSelected} onClose={close} />
        ) : (
          <div className="space-y-2">
            {/*
              Repetir sólo se ofrece en una comida vacía: con algo ya
              registrado, el gesto que se busca es añadir, no duplicar.
            */}
            {isEmpty && repeatable ? (
              <RepeatMealButton date={date} mealType={meal.mealType} template={repeatable} />
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setIsPicking(true)}
            >
              <Plus aria-hidden />
              Añadir alimento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
