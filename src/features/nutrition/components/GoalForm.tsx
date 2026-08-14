import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'

import { useSaveGoal } from '../hooks/use-nutrition'
import { nutritionGoalSchema, type NutritionGoalValues } from '../schemas/nutrition.schema'
import type { NutritionGoal } from '../types/nutrition.types'
import { formatCalories } from '../utils/format'
import { checkGoalBalance } from '../utils/goal-balance'

interface GoalFormProps {
  /** Objetivos vigentes, si ya los fijó; si no, se parte de valores razonables. */
  readonly goal: NutritionGoal | null
  readonly onSaved: () => void
  readonly onCancel: () => void
}

/** Punto de partida cuando aún no hay objetivos: cifras habituales, editables. */
const DEFAULT_VALUES: NutritionGoalValues = {
  caloriesTarget: 2000,
  proteinGTarget: 150,
  carbsGTarget: 200,
  fatGTarget: 65,
  waterMlTarget: 2000,
}

function toFormValues(goal: NutritionGoal): NutritionGoalValues {
  return {
    caloriesTarget: goal.calories_target,
    proteinGTarget: goal.protein_g_target,
    carbsGTarget: goal.carbs_g_target,
    fatGTarget: goal.fat_g_target,
    waterMlTarget: goal.water_ml_target,
  }
}

/** Formulario de metas diarias. */
export function GoalForm({ goal, onSaved, onCancel }: GoalFormProps) {
  const saveGoal = useSaveGoal()

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<NutritionGoalValues>({
    resolver: zodResolver(nutritionGoalSchema),
    defaultValues: goal ? toFormValues(goal) : DEFAULT_VALUES,
  })

  // Se comprueba mientras se escribe, no al guardar: enterarse de que las metas
  // no cuadran justo después de fijarlas obliga a volver a entrar.
  const balance = checkGoalBalance(
    watch('caloriesTarget'),
    watch('proteinGTarget'),
    watch('carbsGTarget'),
    watch('fatGTarget'),
  )

  const onSubmit = handleSubmit((values) => saveGoal.mutate(values, { onSuccess: onSaved }))

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <FormField id="goal-calories" label="Calorías" error={errors.caloriesTarget?.message}>
              <Input
                id="goal-calories"
                type="number"
                inputMode="numeric"
                min={1}
                step={50}
                autoFocus
                aria-invalid={Boolean(errors.caloriesTarget)}
                {...register('caloriesTarget', { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              id="goal-protein"
              label="Proteína (g)"
              error={errors.proteinGTarget?.message}
            >
              <Input
                id="goal-protein"
                type="number"
                inputMode="numeric"
                min={1}
                step={5}
                aria-invalid={Boolean(errors.proteinGTarget)}
                {...register('proteinGTarget', { valueAsNumber: true })}
              />
            </FormField>

            <FormField id="goal-carbs" label="Carbos (g)" error={errors.carbsGTarget?.message}>
              <Input
                id="goal-carbs"
                type="number"
                inputMode="numeric"
                min={1}
                step={5}
                aria-invalid={Boolean(errors.carbsGTarget)}
                {...register('carbsGTarget', { valueAsNumber: true })}
              />
            </FormField>

            <FormField id="goal-fat" label="Grasa (g)" error={errors.fatGTarget?.message}>
              <Input
                id="goal-fat"
                type="number"
                inputMode="numeric"
                min={1}
                step={5}
                aria-invalid={Boolean(errors.fatGTarget)}
                {...register('fatGTarget', { valueAsNumber: true })}
              />
            </FormField>

            <FormField id="goal-water" label="Agua (ml)" error={errors.waterMlTarget?.message}>
              <Input
                id="goal-water"
                type="number"
                inputMode="numeric"
                min={1}
                step={250}
                aria-invalid={Boolean(errors.waterMlTarget)}
                {...register('waterMlTarget', { valueAsNumber: true })}
              />
            </FormField>
          </div>

          {/* Aviso, no impedimento: quien pone las metas manda y puede tener sus
              razones. Pero callarlo dejaría fijar dos objetivos que no se pueden
              cumplir a la vez, y la pantalla del día los enseñaría como si nada. */}
          {balance ? (
            <FormAlert variant="warning">
              Con esos macros salen {formatCalories(balance.fromMacros)}, no{' '}
              {formatCalories(watch('caloriesTarget'))}. Puedes guardarlo igual, pero cumplir las
              dos cosas a la vez no va a poder ser.
            </FormAlert>
          ) : null}

          {saveGoal.isError ? <FormAlert>{saveGoal.error.message}</FormAlert> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saveGoal.isPending}>
              {saveGoal.isPending ? 'Guardando…' : 'Guardar objetivos'}
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
