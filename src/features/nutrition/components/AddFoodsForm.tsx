import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'

import { useAddFoodsToMeal } from '../hooks/use-nutrition'
import { addFoodsSchema, type AddFoodsValues } from '../schemas/nutrition.schema'
import type { FoodRef, MealType } from '../types/nutrition.types'
import { formatCalories, formatServing } from '../utils/format'
import { macrosForServings } from '../utils/macros'

/**
 * Un alimento con la cantidad de la que se parte.
 *
 * `FoodRef` y no `Food` entero: aquí sólo hacen falta el nombre, la porción y
 * los macros, y es lo que llega al repetir una comida —los alimentos vienen del
 * join, en su forma reducida—.
 */
export interface FoodChoice {
  readonly food: FoodRef
  readonly servings: number
}

interface AddFoodsFormProps {
  readonly date: Date
  readonly mealType: MealType
  readonly choices: readonly FoodChoice[]
  readonly onAdded: () => void
  readonly onBack: () => void
}

/**
 * Cuánto se comió de cada alimento elegido, todos en una pantalla.
 *
 * Se enseñan juntos y con el total abajo porque es como se piensa una comida:
 * no «un pollo», sino «esto es lo que almorcé».
 *
 * Las cantidades vienen puestas: **una porción** al elegir del catálogo, que es
 * lo que se come casi siempre, y **las de aquella vez** al repetir una comida
 * anterior. En los dos casos lo normal es no tocar nada.
 *
 * **Cada plato se puede quitar aquí mismo**, que es lo que hace de una comida
 * anterior un punto de partida y no un calco: hoy el mismo almuerzo pero sin el
 * aguacate. El último no se deja quitar, porque guardar una comida sin nada no
 * es guardar nada.
 */
export function AddFoodsForm({ date, mealType, choices, onAdded, onBack }: AddFoodsFormProps) {
  const addFoods = useAddFoodsToMeal(date)
  // Se busca por identificador y no por posición: al quitar un plato los índices
  // se corren, y emparejar por orden pondría el nombre de otro alimento.
  const foodsById = new Map(choices.map(({ food }) => [food.id, food]))

  const {
    control,
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<AddFoodsValues>({
    resolver: zodResolver(addFoodsSchema),
    defaultValues: {
      items: choices.map(({ food, servings }) => ({ foodId: food.id, servings })),
    },
  })

  // `useFieldArray` conserva lo ya escrito al quitar una fila; rehacer la lista
  // a mano perdería las cantidades que se estuvieran ajustando.
  const { fields, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')

  // Lo que sumará al día, antes de confirmarlo. Los alimentos a medio escribir
  // no cuentan: mejor un total que se queda corto que uno con `NaN`.
  const totalCalories = fields.reduce((total, field, index) => {
    const food = foodsById.get(field.foodId)
    const servings = items?.[index]?.servings
    if (!food || servings === undefined || !Number.isFinite(servings) || servings <= 0) return total

    return total + macrosForServings(food, servings).calories
  }, 0)

  const onSubmit = handleSubmit((values) =>
    addFoods.mutate({ mealType, items: values.items }, { onApuntado: onAdded }),
  )

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="font-medium">
          {fields.length === 1 ? 'Cuánto comiste' : `Cuánto comiste de cada uno (${fields.length})`}
        </p>

        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <ul className="space-y-3">
            {fields.map((field, index) => {
              const food = foodsById.get(field.foodId)
              if (!food) return null

              return (
                <li key={field.id} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{food.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Porción: {formatServing(food)} · {formatCalories(food.calories)}
                    </p>
                  </div>

                  <div className="w-20 shrink-0">
                    <FormField
                      id={`servings-${field.id}`}
                      label="Porciones"
                      error={errors.items?.[index]?.servings?.message}
                    >
                      <Input
                        id={`servings-${field.id}`}
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

                  <Button
                    type="button"
                    variant="ghost"
                    size="iconSm"
                    className="mt-6 text-muted-foreground hover:text-destructive"
                    disabled={fields.length === 1}
                    aria-label={`Quitar ${food.name}`}
                    onClick={() => remove(index)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </li>
              )
            })}
          </ul>

          {totalCalories > 0 ? (
            <p className="text-sm text-muted-foreground">
              Sumará{' '}
              <span className="font-medium text-foreground">{formatCalories(totalCalories)}</span>
              {fields.length > 1 ? ' en total' : ''}
            </p>
          ) : null}

          {addFoods.error ? <FormAlert>{addFoods.error.message}</FormAlert> : null}

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
