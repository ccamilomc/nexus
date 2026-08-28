import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { MoneyField } from '@/shared/components/ui/money-input'

import { useCreateFood, useUpdateFood } from '../hooks/use-nutrition'
import { createFoodSchema, type CreateFoodValues } from '../schemas/nutrition.schema'
import type { Food } from '../types/nutrition.types'

interface FoodFormProps {
  /** Nombre inicial al crear desde una búsqueda sin resultados. */
  readonly initialName?: string
  /** Si se indica, el formulario edita ese alimento en lugar de crear uno. */
  readonly food?: Food
  /**
   * Alimento del que se copian los valores para crear uno nuevo.
   *
   * Es lo que evita reteclear seis campos para quedarse con el mismo pollo y
   * otra porción. No se edita: el del catálogo global no es de nadie y la RLS
   * impide tocarlo.
   */
  readonly template?: Food
  /**
   * Casillas ya rellenas que no salen de ningún alimento del catálogo.
   *
   * Hoy lo usa el lector de códigos de barras: lo que llega de fuera se enseña
   * **en el formulario de siempre** para poder revisarlo y corregirlo antes de
   * guardar. Nada entra al catálogo sin pasar por aquí.
   */
  readonly prefill?: CreateFoodValues
  /** De dónde salen las casillas ya rellenas, para poder decirlo en pantalla. */
  readonly prefillNote?: string
  readonly onSaved: (food: Food) => void
  readonly onCancel: () => void
}

/** Vacío se guarda como «sin dato»: convierte '' en undefined. */
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
export function FoodForm({
  initialName = '',
  food,
  template,
  prefill,
  prefillNote,
  onSaved,
  onCancel,
}: FoodFormProps) {
  const createFood = useCreateFood()
  const updateFood = useUpdateFood()
  const isEditing = food !== undefined
  const pending = isEditing ? updateFood : createFood
  // El que se edita, o el que se copia: los dos rellenan las mismas casillas.
  const source = food ?? template

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFoodValues>({
    resolver: zodResolver(createFoodSchema),
    defaultValues:
      prefill ??
      (source
        ? toFormValues(source)
        : {
            name: initialName,
            servingSize: 100,
            servingUnit: 'g',
            calories: 0,
            proteinG: 0,
            carbsG: 0,
            fatG: 0,
          }),
  })

  const onSubmit = handleSubmit((values) => {
    if (food) updateFood.mutate({ foodId: food.id, values }, { onSuccess: onSaved })
    else createFood.mutate(values, { onSuccess: onSaved })
  })

  return (
    <Card>
      <CardContent className="p-4">
        {/* Al copiar hay que decir de dónde salen las cifras ya puestas: si no,
            parecen inventadas por la aplicación. */}
        {template ? (
          <p className="mb-3 text-xs text-muted-foreground">
            Copiado de «{template.name}» del catálogo, que se queda como está. Ponle tu precio y,{' '}
            <strong>si cambias la porción, ajusta también las cifras</strong>: van por porción, no
            se recalculan solas.
          </p>
        ) : null}

        {/* Lo que llega de fuera se dice de dónde viene y se pide revisarlo:
            nadie ha comprobado esas cifras y la etiqueta del paquete manda. */}
        {prefillNote ? <p className="mb-3 text-xs text-muted-foreground">{prefillNote}</p> : null}

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
            <MoneyField
              control={control}
              name="costPerServing"
              id="food-cost"
              placeholder="Ej. 12000"
              aria-invalid={Boolean(errors.costPerServing)}
              optional
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
