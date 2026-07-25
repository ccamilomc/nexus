import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'

import { useCreateFood, useUpdateFood } from '../hooks/use-nutrition'
import { createFoodSchema, type CreateFoodValues } from '../schemas/nutrition.schema'
import type { Food } from '../types/nutrition.types'

interface FoodFormProps {
  /** Nombre inicial al crear desde una búsqueda sin resultados. */
  readonly initialName?: string
  /** Si se indica, el formulario edita ese alimento en lugar de crear uno. */
  readonly food?: Food
  readonly onSaved: (food: Food) => void
  readonly onCancel: () => void
}

/** Vacío se guarda como «sin dato»: convierte '' en undefined. */
function optionalNumber(value: string): number | undefined {
  return value === '' ? undefined : Number(value)
}

function toFormValues(food: Food): CreateFoodValues {
  return {
    name: food.name,
    servingSize: food.serving_size,
    servingUnit: food.serving_unit,
    calories: food.calories,
    proteinG: food.protein_g,
    carbsG: food.carbs_g,
    fatG: food.fat_g,
    ...(food.brand ? { brand: food.brand } : {}),
    ...(food.cost_per_serving !== null ? { costPerServing: food.cost_per_serving } : {}),
  }
}

/** Formulario para crear o editar un alimento propio. */
export function FoodForm({ initialName = '', food, onSaved, onCancel }: FoodFormProps) {
  const createFood = useCreateFood()
  const updateFood = useUpdateFood()
  const isEditing = food !== undefined
  const pending = isEditing ? updateFood : createFood

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFoodValues>({
    resolver: zodResolver(createFoodSchema),
    defaultValues: food
      ? toFormValues(food)
      : {
          name: initialName,
          servingSize: 100,
          servingUnit: 'g',
          calories: 0,
          proteinG: 0,
          carbsG: 0,
          fatG: 0,
        },
  })

  const onSubmit = handleSubmit((values) => {
    if (food) updateFood.mutate({ foodId: food.id, values }, { onSuccess: onSaved })
    else createFood.mutate(values, { onSuccess: onSaved })
  })

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField id="food-name" label="Nombre" error={errors.name?.message}>
            <Input
              id="food-name"
              autoFocus
              placeholder="Ej. Hamburguesa sencilla"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
          </FormField>

          <FormField id="food-brand" label="Marca o sitio (opcional)" error={errors.brand?.message}>
            <Input id="food-brand" placeholder="Ej. El Corral" {...register('brand')} />
          </FormField>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Porción</legend>
            <p className="text-xs text-muted-foreground">
              Los valores de abajo son <strong>por esta porción</strong>. Para una hamburguesa
              entera, pon 1 y «unidad».
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                id="food-serving-size"
                label="Cantidad"
                error={errors.servingSize?.message}
              >
                <Input
                  id="food-serving-size"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={1}
                  aria-invalid={Boolean(errors.servingSize)}
                  {...register('servingSize', { valueAsNumber: true })}
                />
              </FormField>

              <FormField id="food-serving-unit" label="Unidad" error={errors.servingUnit?.message}>
                <Input
                  id="food-serving-unit"
                  placeholder="g, ml, unidad"
                  aria-invalid={Boolean(errors.servingUnit)}
                  {...register('servingUnit')}
                />
              </FormField>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Por porción</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <FormField id="food-calories" label="Calorías" error={errors.calories?.message}>
                <Input
                  id="food-calories"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  aria-invalid={Boolean(errors.calories)}
                  {...register('calories', { valueAsNumber: true })}
                />
              </FormField>

              <FormField id="food-protein" label="Proteína (g)" error={errors.proteinG?.message}>
                <Input
                  id="food-protein"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.1}
                  aria-invalid={Boolean(errors.proteinG)}
                  {...register('proteinG', { valueAsNumber: true })}
                />
              </FormField>

              <FormField id="food-carbs" label="Carbos (g)" error={errors.carbsG?.message}>
                <Input
                  id="food-carbs"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.1}
                  aria-invalid={Boolean(errors.carbsG)}
                  {...register('carbsG', { valueAsNumber: true })}
                />
              </FormField>

              <FormField id="food-fat" label="Grasa (g)" error={errors.fatG?.message}>
                <Input
                  id="food-fat"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.1}
                  aria-invalid={Boolean(errors.fatG)}
                  {...register('fatG', { valueAsNumber: true })}
                />
              </FormField>
            </div>
          </fieldset>

          <FormField
            id="food-cost"
            label="Precio por porción (COP, opcional)"
            error={errors.costPerServing?.message}
          >
            <Input
              id="food-cost"
              type="number"
              inputMode="numeric"
              min={0}
              // El peso colombiano no tiene centavos: se avanza de 100 en 100.
              step={100}
              placeholder="Ej. 12000"
              aria-invalid={Boolean(errors.costPerServing)}
              {...register('costPerServing', { setValueAs: optionalNumber })}
            />
          </FormField>

          {pending.isError ? <FormAlert>{pending.error.message}</FormAlert> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending.isPending}>
              {pending.isPending
                ? 'Guardando…'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Guardar alimento'}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
