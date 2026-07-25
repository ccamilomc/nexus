import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'

import { useAddFoodToMeal } from '../hooks/use-nutrition'
import { addFoodSchema, type AddFoodValues } from '../schemas/nutrition.schema'
import type { Food, MealType } from '../types/nutrition.types'
import { formatCalories, formatServing } from '../utils/format'
import { macrosForServings } from '../utils/macros'

interface AddFoodFormProps {
  readonly date: Date
  readonly mealType: MealType
  readonly food: Food
  readonly onAdded: () => void
  readonly onBack: () => void
}

/** Cuánto se comió del alimento elegido, con la equivalencia a la vista. */
export function AddFoodForm({ date, mealType, food, onAdded, onBack }: AddFoodFormProps) {
  const addFood = useAddFoodToMeal(date)

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<AddFoodValues>({
    resolver: zodResolver(addFoodSchema),
    defaultValues: { servings: 1 },
  })

  const servings = watch('servings')
  // Vista previa: lo que sumará al día antes de confirmarlo.
  const preview =
    Number.isFinite(servings) && servings > 0 ? macrosForServings(food, servings) : null

  const onSubmit = handleSubmit(({ servings: amount }) => {
    addFood.mutate({ mealType, foodId: food.id, servings: amount }, { onSuccess: onAdded })
  })

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div>
          <p className="font-medium">{food.name}</p>
          <p className="text-xs text-muted-foreground">
            Porción: {formatServing(food)} · {formatCalories(food.calories)}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <FormField id="servings" label="Porciones" error={errors.servings?.message}>
            <Input
              id="servings"
              type="number"
              inputMode="decimal"
              step={0.5}
              min={0}
              autoFocus
              aria-invalid={Boolean(errors.servings)}
              {...register('servings', { valueAsNumber: true })}
            />
          </FormField>

          {preview ? (
            <p className="text-sm text-muted-foreground">
              Sumará{' '}
              <span className="font-medium text-foreground">
                {formatCalories(preview.calories)}
              </span>
            </p>
          ) : null}

          {addFood.isError ? <FormAlert>{addFood.error.message}</FormAlert> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={addFood.isPending}>
              {addFood.isPending ? 'Añadiendo…' : 'Añadir'}
            </Button>
            <Button type="button" variant="ghost" onClick={onBack}>
              Volver
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
