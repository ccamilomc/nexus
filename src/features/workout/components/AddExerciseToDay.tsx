import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'

import { useAddRoutineExercise } from '../hooks/use-routine-detail'
import {
  routineExerciseTargetsSchema,
  type RoutineExerciseTargetsValues,
} from '../schemas/workout.schema'
import type { Exercise } from '../types/workout.types'
import { ExercisePicker } from './ExercisePicker'

interface AddExerciseToDayProps {
  readonly routineId: string
  readonly dayId: string
  /** Ejercicios ya prescritos en el día: no se ofrecen otra vez. */
  readonly excludedIds: readonly string[]
  readonly onDone: () => void
}

/** Vacío se guarda como «sin objetivo»: convierte '' en undefined. */
function optionalNumber(value: string): number | undefined {
  return value === '' ? undefined : Number(value)
}

/** Flujo de dos pasos: elegir el ejercicio y fijar sus objetivos opcionales. */
export function AddExerciseToDay({ routineId, dayId, excludedIds, onDone }: AddExerciseToDayProps) {
  const [selected, setSelected] = useState<Exercise | null>(null)
  const addExercise = useAddRoutineExercise(routineId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoutineExerciseTargetsValues>({
    resolver: zodResolver(routineExerciseTargetsSchema),
    defaultValues: {},
  })

  if (!selected) {
    return <ExercisePicker excludedIds={excludedIds} onSelect={setSelected} onClose={onDone} />
  }

  const onSubmit = handleSubmit((targets) => {
    addExercise.mutate({ dayId, exerciseId: selected.id, targets }, { onSuccess: onDone })
  })

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="font-medium">{selected.name}</p>

        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <div className="grid grid-cols-3 gap-2">
            <FormField id="target-sets" label="Series" error={errors.targetSets?.message}>
              <Input
                id="target-sets"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="3"
                aria-invalid={Boolean(errors.targetSets)}
                {...register('targetSets', { setValueAs: optionalNumber })}
              />
            </FormField>

            <FormField id="target-reps" label="Reps" error={errors.targetReps?.message}>
              <Input
                id="target-reps"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="10"
                aria-invalid={Boolean(errors.targetReps)}
                {...register('targetReps', { setValueAs: optionalNumber })}
              />
            </FormField>

            <FormField id="target-weight" label="Peso (kg)" error={errors.targetWeightKg?.message}>
              <Input
                id="target-weight"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.5}
                placeholder="60"
                aria-invalid={Boolean(errors.targetWeightKg)}
                {...register('targetWeightKg', { setValueAs: optionalNumber })}
              />
            </FormField>
          </div>

          <p className="text-xs text-muted-foreground">Los objetivos son opcionales.</p>

          {addExercise.isError ? <FormAlert>{addExercise.error.message}</FormAlert> : null}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={addExercise.isPending}>
              {addExercise.isPending ? 'Añadiendo…' : 'Añadir a la rutina'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(null)}>
              Volver
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
