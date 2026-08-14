import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'

import { useAddFoodsToMeal } from '../hooks/use-nutrition'
import { addFoodsSchema, type AddFoodsValues } from '../schemas/nutrition.schema'
import type { Food, MealType } from '../types/nutrition.types'
import { formatCalories, formatServing } from '../utils/format'
import { macrosForServings } from '../utils/macros'

interface AddFoodsFormProps {
  readonly date: Date
  readonly mealType: MealType
  readonly foods: readonly Food[]
  readonly onAdded: () => void
  readonly onBack: () => void
}

/**
 * Cuánto se comió de cada alimento elegido, todos en una pantalla.
 *
 * Se enseñan juntos y con el total abajo porque es como se piensa una comida:
 * no «un pollo», sino «esto es lo que almorcé». Cada uno arranca en una porción,
 * que es lo que se come casi siempre, así que lo normal es no tocar nada.
 */
export function AddFoodsForm({ date, mealType, foods, onAdded, onBack }: AddFoodsFormProps) {
  const addFoods = useAddFoodsToMeal(date)

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<AddFoodsValues>({
    resolver: zodResolver(addFoodsSchema),
    defaultValues: { items: foods.map((food) => ({ foodId: food.id, servings: 1 })) },
  })

  const items = watch('items')

  // Lo que sumará al día, antes de confirmarlo. Los alimentos a medio escribir
  // no cuentan: mejor un total que se queda corto que uno con `NaN`.
  const totalCalories = foods.reduce((total, food, index) => {
    const servings = items?.[index]?.servings
    if (servings === undefined || !Number.isFinite(servings) || servings <= 0) return total

    return total + macrosForServings(food, servings).calories
  }, 0)

  const onSubmit = handleSubmit((values) =>
    addFoods.mutate({ mealType, items: values.items }, { onSuccess: onAdded }),
  )

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="font-medium">
          {foods.length === 1 ? 'Cuánto comiste' : `Cuánto comiste de cada uno (${foods.length})`}
        </p>

        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <ul className="space-y-3">
            {foods.map((food, index) => (
              <li key={food.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{food.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Porción: {formatServing(food)} · {formatCalories(food.calories)}
                  </p>
                </div>

                <div className="w-24 shrink-0">
                  <FormField
                    id={`servings-${food.id}`}
                    label="Porciones"
                    error={errors.items?.[index]?.servings?.message}
                  >
                    <Input
                      id={`servings-${food.id}`}
                      type="number"
                      inputMode="decimal"
                      step={0.5}
                      min={0}
                      autoFocus={index === 0}
                      aria-invalid={Boolean(errors.items?.[index]?.servings)}
                      {...register(`items.${index}.servings`, { valueAsNumber: true })}
                    />
                  </FormField>
                  {/* El identificador viaja en el formulario para que cada
                      cantidad no dependa del orden en que se pinten. */}
                  <input type="hidden" {...register(`items.${index}.foodId`)} />
                </div>
              </li>
            ))}
          </ul>

          {totalCalories > 0 ? (
            <p className="text-sm text-muted-foreground">
              Sumará{' '}
              <span className="font-medium text-foreground">{formatCalories(totalCalories)}</span>
              {foods.length > 1 ? ' en total' : ''}
            </p>
          ) : null}

          {addFoods.isError ? <FormAlert>{addFoods.error.message}</FormAlert> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={addFoods.isPending}>
              {addFoods.isPending ? 'Añadiendo…' : 'Añadir'}
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
